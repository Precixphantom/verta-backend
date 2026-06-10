import pool from './db.js';

const createTables = async () => {
  try {
    await pool.query(`

      -- Stores every course Verta supports (e.g. Medicine, Law, Computer Science)
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        jamb_combination TEXT NOT NULL,   -- e.g. "English, Physics, Chemistry, Biology"
        salary_range VARCHAR(100),         -- e.g. "₦150,000 - ₦400,000/month"
        career_paths TEXT                  -- e.g. "Software Engineer, Data Analyst"
      );

      -- Stores Nigerian universities
      CREATE TABLE IF NOT EXISTS universities (
            id SERIAL PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            state VARCHAR(50) NOT NULL,
            accreditation_status VARCHAR(50) DEFAULT 'Accredited',
            type VARCHAR(20) NOT NULL CHECK (type IN ('Federal', 'State', 'Private'))
        );

      -- Links courses to universities with cut-off scores
      -- One course can be offered at many universities, each with different cut-offs
      CREATE TABLE IF NOT EXISTS course_university (
        id SERIAL PRIMARY KEY,
        course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
        university_id INTEGER REFERENCES universities(id) ON DELETE CASCADE,
        utme_cutoff INTEGER NOT NULL,       -- minimum JAMB score for this course at this school
        post_utme_cutoff INTEGER           -- minimum Post-UTME score if applicable
      );

      -- Stores aptitude quiz questions for both JSS and SSS students
      CREATE TABLE IF NOT EXISTS aptitude_questions (
        id SERIAL PRIMARY KEY,
        question_text TEXT NOT NULL,
        level VARCHAR(10) NOT NULL CHECK (level IN ('JSS', 'SSS')),  -- which student level sees this
        category VARCHAR(50)               -- e.g. "logical", "verbal", "numerical"
      );

      -- Stores the answer options for each question
      -- Each option carries weights that determine department or course match
      CREATE TABLE IF NOT EXISTS question_options (
        id SERIAL PRIMARY KEY,
        question_id INTEGER REFERENCES aptitude_questions(id) ON DELETE CASCADE,
        option_text TEXT NOT NULL,
        weight_science DECIMAL(4,2) DEFAULT 0,     -- how much this answer points toward Science
        weight_arts DECIMAL(4,2) DEFAULT 0,         -- how much this answer points toward Arts
        weight_commercial DECIMAL(4,2) DEFAULT 0    -- how much this answer points toward Commercial
      );

    `);

    console.log('All tables created successfully');
    process.exit(0);

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
};

createTables();