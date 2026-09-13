import { GoogleGenerativeAI } from '@google/generative-ai';
import pool from '../config/db.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const chat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Pull all courses and their university details, now including the
    // Phase 2 fields: duration, localized naming, O-Level requirements,
    // USD salary, and industry verticals.
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

    // Format the database rows into readable text for the system prompt
    // Group by course so Olu sees: course → its universities → their details
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

      // Cutoffs aren't sourced yet for any row, say so plainly instead of
      // printing "null" or letting the model guess a number.
      const cutoffText = row.utme_cutoff
        ? `UTME: ${row.utme_cutoff}, Post-UTME: ${row.post_utme_cutoff}%`
        : `UTME/Post-UTME cutoff: not yet available`;

      const durationText = row.duration_years ? `${row.duration_years}-year program` : '';
      const localizedText = row.localized_course_name && row.localized_course_name !== row.course_name
        ? ` (offered here as "${row.localized_course_name}")`
        : '';

      courseMap[row.course_name].universities.push(
        `${row.university_name} (${row.state}, ${row.type})${localizedText} — ${durationText}, ${cutoffText}`
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
      systemInstruction: `You are Olu, a warm and knowledgeable Nigerian academic counselor for secondary school students.
You understand JAMB, Post-UTME, O-level requirements, WAEC, NECO, and Nigerian university admissions.

[CRITICAL RULE]
You must ONLY use the database below to answer questions about courses, universities, cutoff scores, salaries, and requirements.
If a student asks about a course or university not in the database, tell them your current database only covers specific institutions.
Never guess or make up scores, combinations, salaries, or university names.

[ADMISSIONS LOGIC]
- JAMB scores are out of 400. Post-UTME scores are percentages out of 100.
- A student is competitive ONLY if their scores meet or exceed BOTH the utme_cutoff AND post_utme_cutoff for their chosen school.
- Some entries say cutoff data is "not yet available." If a student asks about their chances at one of these, tell them honestly that cutoff data for that school isn't in the system yet, do not invent a number or estimate one.
- When a university offers a course under a different local name (shown in parentheses), mention that name specifically if the student is asking about JAMB registration for that school.
- Always be concise, warm, and direct.

[DATABASE]
${dbText}`
    });

    const geminiResult = await model.generateContent(message);
    const reply = geminiResult.response.text();

    res.status(200).json({ reply });

  } catch (error) {
    console.error('Olu chat error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};