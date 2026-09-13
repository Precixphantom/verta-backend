import pool from './db.js';

// Phase 2 migration. Existing tables (courses, universities, course_university)
// already have live data, so we ALTER them instead of using CREATE TABLE IF NOT EXISTS,
// which would silently do nothing on a table that already exists.
const migratePhase2 = async () => {
  try {
    await pool.query(`

      -- New table. Nothing like this existed before, there was no auth at all.
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        level VARCHAR(10) CHECK (level IN ('JSS', 'SSS')),

        -- the actual identity lock this whole task is about
        assessment_locked BOOLEAN DEFAULT false,

        -- score matrix, filled in once the user finishes the unified assessment
        science_score DECIMAL(5,2),
        commercial_score DECIMAL(5,2),
        arts_score DECIMAL(5,2),
        recommended_track VARCHAR(20),

        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Fields that are constant per course regardless of which university offers it.
      -- Confirmed against the seed file: these never vary within a course.
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS olevel_requirements TEXT;
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS usd_salary_range VARCHAR(100);
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS industry_verticals TEXT;
      -- career_paths stays as is, industry_verticals is kept separate per your call.

      -- Fields that change depending on the course-university pairing.
      -- Confirmed against the seed file: only Computer Science at OAU differs
      -- from the rest (5 years, "with Mathematics / Economics"), which is exactly
      -- why these live here and not on courses.
      ALTER TABLE course_university ADD COLUMN IF NOT EXISTS duration_years INTEGER;
      ALTER TABLE course_university ADD COLUMN IF NOT EXISTS localized_course_name VARCHAR(150);

    `);

    console.log('Phase 2 migration complete');
    process.exit(0);

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
};

migratePhase2();