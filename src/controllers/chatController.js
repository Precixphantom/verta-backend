import { GoogleGenerativeAI } from '@google/generative-ai';
import pool from '../config/db.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const chat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Pull all courses and their university cutoffs from the database
    const result = await pool.query(`
      SELECT
        c.name AS course_name,
        c.jamb_combination,
        c.salary_range,
        c.career_paths,
        u.name AS university_name,
        u.state,
        u.type,
        cu.utme_cutoff,
        cu.post_utme_cutoff
      FROM courses c
      JOIN course_university cu ON c.id = cu.course_id
      JOIN universities u ON u.id = cu.university_id
      ORDER BY c.name ASC, cu.utme_cutoff DESC
    `);

    // Format the database rows into readable text for the system prompt
    // Group by course so Olu sees: course → its universities → their cutoffs
    const courseMap = {};
    result.rows.forEach(row => {
      if (!courseMap[row.course_name]) {
        courseMap[row.course_name] = {
          jamb_combination: row.jamb_combination,
          salary_range: row.salary_range,
          career_paths: row.career_paths,
          universities: []
        };
      }
      courseMap[row.course_name].universities.push(
        `${row.university_name} (${row.state}, ${row.type}) — UTME: ${row.utme_cutoff}, Post-UTME: ${row.post_utme_cutoff}%`
      );
    });

    const dbText = Object.entries(courseMap).map(([course, data]) => {
      return [
        `Course: ${course}`,
        `JAMB Combination: ${data.jamb_combination}`,
        `Salary Range: ${data.salary_range}`,
        `Career Paths: ${data.career_paths}`,
        `Universities offering this course:`,
        data.universities.map(u => `  - ${u}`).join('\n')
      ].join('\n');
    }).join('\n\n');

    // Build the model with the live database injected into the system prompt
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: `You are Olu, a warm and knowledgeable Nigerian academic counselor for secondary school students.
You understand JAMB, Post-UTME, O-level requirements, WAEC, NECO, and Nigerian university admissions.

[CRITICAL RULE]
You must ONLY use the database below to answer questions about courses, universities, and cutoff scores.
If a student asks about a course or university not in the database, tell them your current database only covers specific institutions.
Never guess or make up scores, combinations, or university names.

[ADMISSIONS LOGIC]
- JAMB scores are out of 400. Post-UTME scores are percentages out of 100.
- A student is competitive ONLY if their scores meet or exceed BOTH the utme_cutoff AND post_utme_cutoff for their chosen school.
- Always be concise, warm, and direct.
- When answering about admission requirements, ALWAYS state both the UTME cutoff AND the Post-UTME cutoff together. Never give one without the other.

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