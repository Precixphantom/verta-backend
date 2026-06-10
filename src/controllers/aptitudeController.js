
import pool from '../config/db.js';

import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  systemInstruction: `You are a JSON-only response engine for Nigerian secondary school academic guidance.
You will receive a Nigerian student's quiz answers and a list of university courses.
You must always return a valid JSON array with exactly 3 objects.
Never include markdown, code fences, explanations, or any text outside the JSON array.`
});

export const getAptitudeResult = async (req, res) => {
  try {
    // The request body should look like this:
    // {
    //   "level": "JSS",
    //   "answers": [
    //     { "question_id": 1, "option_id": 2 },
    //     { "question_id": 2, "option_id": 5 },
    //     ...
    //   ]
    // }

    const { level, answers } = req.body;

    // Basic validation: level must be JSS or SSS
    if (!level || !['JSS', 'SSS'].includes(level)) {
      return res.status(400).json({ error: 'Level must be JSS or SSS' });
    }

    // Basic validation: answers must be a non-empty array
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Answers must be a non-empty array' });
    }

    // Extract the option IDs from the answers array
    const optionIds = answers.map(a => a.option_id);

    // Fetch the weights for every selected option from the database
    const result = await pool.query(
      `SELECT id, weight_science, weight_arts, weight_commercial
       FROM question_options
       WHERE id = ANY($1::int[])`,
      [optionIds]
    );

    // Add up the weights across all selected options
    let scienceScore = 0;
    let artsScore = 0;
    let commercialScore = 0;

    result.rows.forEach(option => {
      scienceScore += parseFloat(option.weight_science);
      artsScore += parseFloat(option.weight_arts);
      commercialScore += parseFloat(option.weight_commercial);
    });

    // Calculate the total score to get percentages for each department
    const totalScore = scienceScore + artsScore + commercialScore;

    const scores = {
      Science: totalScore > 0 ? ((scienceScore / totalScore) * 100).toFixed(1) : '0.0',
      Arts: totalScore > 0 ? ((artsScore / totalScore) * 100).toFixed(1) : '0.0',
      Commercial: totalScore > 0 ? ((commercialScore / totalScore) * 100).toFixed(1) : '0.0',
    };

    // Find the department with the highest score
    // If there is a tie, return all tied departments and ask the student to pick
    const maxScore = Math.max(...Object.values(scores).map(Number));
    const tiedDepartments = Object.keys(scores).filter(
    dept => Number(scores[dept]) === maxScore
        );

const recommendedDepartment = tiedDepartments.length === 1
  ? tiedDepartments[0]
  : null;

    if (level === 'JSS') {
  // If there is a clear winner, return the recommendation
  if (recommendedDepartment) {
    return res.status(200).json({
      level: 'JSS',
      recommended_department: recommendedDepartment,
      scores,
      message: `Based on your answers, you are best suited for the ${recommendedDepartment} department.`
    });
  }

  // If there is a tie, tell the frontend which departments tied
  // The frontend will ask the student to choose between them
  return res.status(200).json({
    level: 'JSS',
    recommended_department: null,
    tied_departments: tiedDepartments,
    scores,
    message: `You scored equally in ${tiedDepartments.join(' and ')}. Which of these interests you more?`
  });
}

    if (level === 'SSS') {
      // Fetch the text of each selected option from the database
      const optionIds = answers.map(a => a.option_id);

      const optionResult = await pool.query(
        `SELECT qo.id, qo.option_text, aq.question_text
         FROM question_options qo
         JOIN aptitude_questions aq ON qo.question_id = aq.id
         WHERE qo.id = ANY($1::int[])`,
        [optionIds]
      );

      // Format the answers into readable text for Gemini
      const formattedAnswers = optionResult.rows
        .map((row, index) => `Q${index + 1}: ${row.question_text}\nAnswer: ${row.option_text}`)
        .join('\n\n');

      const courseResult = await pool.query(
        `SELECT name FROM courses ORDER BY id ASC`
      );
      const courseList = courseResult.rows.map(row => row.name);

      const prompt = `You are an academic guidance counselor for Nigerian secondary school students.

A student has completed an aptitude quiz. Here are their responses:

${formattedAnswers}

Based on these responses, match this student to the top 3 most suitable university courses from this list only:
${courseList.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Return your response as a JSON array with exactly 3 objects. Each object must have these exact fields:
- "course_id": the number of the course from the numbered list above (integer)
- "course_name": the exact course name from the list above (string)

Return only the JSON array. No explanation. No markdown. No extra text.`;

      const geminiResult = await model.generateContent(prompt);
const rawText = geminiResult.response.text().trim();

// Strip markdown code fences if Gemini adds them despite instructions
const cleanText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

let matches;
try {
  matches = JSON.parse(cleanText);
} catch (parseError) {
  console.error('Gemini SSS parse error:', rawText);
  return res.status(500).json({ error: 'Failed to parse course recommendations. Try again.' });
}

      return res.status(200).json({
        level: 'SSS',
        top_matches: matches,
        message: 'Here are your top 3 course matches based on your answers.'
      });
    }

  } catch (error) {
    console.error('Aptitude result error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const getAptitudeQuestions = async (req, res) => {
  try {
    const { level } = req.query;

    if (!level || !['JSS', 'SSS'].includes(level)) {
      return res.status(400).json({ error: 'Level must be JSS or SSS' });
    }

    const questionsResult = await pool.query(
      `SELECT id, question_text, category
       FROM aptitude_questions
       WHERE level = $1
       ORDER BY id ASC`,
      [level]
    );

    if (questionsResult.rows.length === 0) {
      return res.status(404).json({ error: 'No questions found for this level' });
    }

    const questionIds = questionsResult.rows.map(q => q.id);

    const optionsResult = await pool.query(
      `SELECT id, question_id, option_text
       FROM question_options
       WHERE question_id = ANY($1::int[])
       ORDER BY id ASC`,
      [questionIds]
    );

    // Group options under their parent question
    const optionsByQuestion = {};
    optionsResult.rows.forEach(option => {
      if (!optionsByQuestion[option.question_id]) {
        optionsByQuestion[option.question_id] = [];
      }
      optionsByQuestion[option.question_id].push({
        id: option.id,
        option_text: option.option_text
      });
    });

    const questions = questionsResult.rows.map(q => ({
      id: q.id,
      question_text: q.question_text,
      category: q.category,
      options: optionsByQuestion[q.id] || []
    }));

    res.status(200).json({
      level,
      count: questions.length,
      questions
    });

  } catch (error) {
    console.error('getAptitudeQuestions error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};