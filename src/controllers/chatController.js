import { GoogleGenerativeAI } from '@google/generative-ai'; // Gemini client library
import pool from '../config/db.js'; // shared database connection

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // key stays in env so it never ships in code

// Safety net. The prompt asks for plain text, but models sometimes slip.
// Cleaning on the server means every client gets safe text, whatever the frontend does.
const cleanReply = text =>
  text
    .replace(/\*\*/g, '') // bold markers show up as literal symbols in the bubble
    .replace(/^\s*[*-]\s+/gm, '\u2022 ') // bullet starts become a real bullet, readable even if lines collapse
    .replace(/^#+\s*/gm, '') // heading hashes are not rendered by the bubble
    .replace(/\*/g, '') // any leftover asterisks
    .replace(/\n{3,}/g, '\n\n') // runaway blank lines look sloppy
    .trim(); // stray whitespace at the edges looks odd in a bubble

export const chat = async (req, res) => {
  try {
    const { message } = req.body; // the student's question

    if (!message) {
      return res.status(400).json({ error: 'Message is required' }); // nothing to answer
    }

    // Pull all courses and their university details.
    const result = await pool.query(`
      SELECT
        c.name AS course_name,
        c.jamb_combination,
        c.olevel_requirements,
        c.salary_range,
        c.usd_salary_range,
        c.career_paths,
        c.industry_verticals,
        u.name AS university_name,
        u.state,
        u.type,
        cu.utme_cutoff,
        cu.post_utme_cutoff,
        cu.duration_years,
        cu.localized_course_name
      FROM courses c
      JOIN course_university cu ON c.id = cu.course_id
      JOIN universities u ON u.id = cu.university_id
      ORDER BY c.name ASC, cu.utme_cutoff DESC
    `);

    // Group rows by course so Olu sees: course, then its universities, then details.
    const courseMap = {};
    result.rows.forEach(row => {
      if (!courseMap[row.course_name]) {
        courseMap[row.course_name] = {
          jamb_combination: row.jamb_combination,
          olevel_requirements: row.olevel_requirements,
          salary_range: row.salary_range,
          usd_salary_range: row.usd_salary_range,
          career_paths: row.career_paths,
          industry_verticals: row.industry_verticals,
          universities: []
        };
      }

      // Cutoffs are not sourced yet for any row. Say so plainly instead of printing null.
      const cutoffText = row.utme_cutoff
        ? `UTME: ${row.utme_cutoff}, Post-UTME: ${row.post_utme_cutoff}%`
        : `UTME/Post-UTME cutoff: not yet available`;

      const durationText = row.duration_years ? `${row.duration_years}-year program` : '';
      const localizedText = row.localized_course_name && row.localized_course_name !== row.course_name
        ? ` (offered here as "${row.localized_course_name}")`
        : '';

      courseMap[row.course_name].universities.push(
        `${row.university_name} (${row.state}, ${row.type})${localizedText} - ${durationText}, ${cutoffText}`
      );
    });

    const dbText = Object.entries(courseMap).map(([course, data]) => {
      return [
        `Course: ${course}`,
        `JAMB Combination: ${data.jamb_combination}`,
        `O-Level Requirements: ${data.olevel_requirements || 'not specified'}`,
        `Salary Range (NGN): ${data.salary_range}`,
        `Salary Range (USD): ${data.usd_salary_range || 'not specified'}`,
        `Career Paths: ${data.career_paths}`,
        `Industry Verticals: ${data.industry_verticals || 'not specified'}`,
        `Universities offering this course:`,
        data.universities.map(u => `  - ${u}`).join('\n')
      ].join('\n');
    }).join('\n\n');

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: `You are Olu, a warm and knowledgeable guide for Nigerian secondary school students.
You understand JAMB, Post-UTME, O-level requirements, WAEC, NECO, and Nigerian university admissions.
Never call yourself a counsellor. You are a guide, and people make the final decisions.

[CRITICAL RULE]
You must ONLY use the database below to answer questions about courses, universities, cutoff scores, salaries, and requirements.
If a student asks about a course or university not in the database, tell them your current database only covers specific institutions.
Never guess or make up scores, combinations, salaries, or university names.

[ADMISSIONS LOGIC]
- JAMB scores are out of 400. Post-UTME scores are percentages out of 100.
- A student is competitive ONLY if their scores meet or exceed BOTH the utme_cutoff AND post_utme_cutoff for their chosen school.
- Some entries say cutoff data is "not yet available." If a student asks about their chances at one of these, tell them honestly that cutoff data for that school isn't in the system yet, do not invent a number or estimate one.
- When a university offers a course under a different local name (shown in parentheses), mention that name specifically if the student is asking about JAMB registration for that school.
- Requirements can differ slightly between universities, so remind students to confirm with their chosen school and the current JAMB brochure before registering.

[STYLE]
- Write in plain text only. Never use asterisks, bullet points, numbered lists, bold, headings or any markdown symbols.
- Do not write lists. Put items inside a sentence, separated by commas. Example: "For Law you will need English Language, Literature in English and Government."
- Keep replies to 2 to 4 short sentences unless the student asks for more detail.
- Be warm, concise and direct.

[DATABASE]
${dbText}`
    });

    const geminiResult = await model.generateContent(message); // single turn, no history yet
    const reply = cleanReply(geminiResult.response.text()); // clean before sending so the bubble never shows markdown

    res.status(200).json({ reply }); // same response shape, so the frontend needs no change

  } catch (error) {
    console.error('Olu chat error:', error.message); // log the message only, never student data
    res.status(500).json({ error: 'Internal server error' });
  }
};