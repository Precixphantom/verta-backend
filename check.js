import pool from './src/config/db.js';

const result = await pool.query(`
  SELECT qo.id AS option_id, qo.question_id, aq.level, aq.question_text, qo.option_text
  FROM question_options qo
  JOIN aptitude_questions aq ON aq.id = qo.question_id
  WHERE aq.level = 'SSS'
  ORDER BY qo.question_id ASC, qo.id ASC
  LIMIT 20
`);
console.log(result.rows);
process.exit(0);