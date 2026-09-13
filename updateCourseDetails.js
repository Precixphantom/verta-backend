import pool from './src/config/db.js';
import xlsx from 'xlsx';

// This is an UPDATE script, not a seed script. The 255 rows in the Excel file
// are the same 255 course-university pairings already in the database, just
// with new columns filled in. We match by name, not by inserting fresh rows,
// and we never touch utme_cutoff, that data is already correct.

const FILE_PATH = './Verta_Final_Seed_No_Cutoffs.xlsx';

const run = async () => {
  const workbook = xlsx.readFile(FILE_PATH);
  const sheetName = workbook.SheetNames[0];
  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  console.log(`Read ${rows.length} rows from the seed file`);

  const updatedCourses = new Set();

  let unmatchedCourse = 0;
  let unmatchedUniversity = 0;
  let updatedPairs = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const courseName = row.course_name?.trim();
    const universityName = row.university_name?.trim();

    // progress line, printed every single row, so a freeze shows up immediately
    console.log(`[${i + 1}/${rows.length}] ${courseName} @ ${universityName}`);

    const courseResult = await pool.query(
      'SELECT id FROM courses WHERE name = $1',
      [courseName]
    );
    if (courseResult.rows.length === 0) {
      console.warn(`  -> No matching course found for "${courseName}"`);
      unmatchedCourse++;
      continue;
    }
    const courseId = courseResult.rows[0].id;

    if (!updatedCourses.has(courseId)) {
      await pool.query(
        `UPDATE courses
         SET olevel_requirements = $1,
             usd_salary_range = $2,
             industry_verticals = $3
         WHERE id = $4`,
        [
          row.olevel_requirements,
          row.usd_salary_range_yearly,
          row.industry_verticals,
          courseId,
        ]
      );
      updatedCourses.add(courseId);
    }

    const universityResult = await pool.query(
      'SELECT id FROM universities WHERE name = $1',
      [universityName]
    );
    if (universityResult.rows.length === 0) {
      console.warn(`  -> No matching university found for "${universityName}"`);
      unmatchedUniversity++;
      continue;
    }
    const universityId = universityResult.rows[0].id;

    const updateResult = await pool.query(
      `UPDATE course_university
       SET duration_years = $1,
           localized_course_name = $2
       WHERE course_id = $3 AND university_id = $4`,
      [row.duration_years, row.localized_course_name, courseId, universityId]
    );

    if (updateResult.rowCount === 0) {
      console.warn(
        `  -> No existing course_university row for "${courseName}" at "${universityName}", nothing updated`
      );
    } else {
      updatedPairs++;
    }
  }

  console.log(`\nDone.`);
  console.log(`Course-university pairs updated: ${updatedPairs}`);
  console.log(`Unmatched course names: ${unmatchedCourse}`);
  console.log(`Unmatched university names: ${unmatchedUniversity}`);

  process.exit(0);
};

run().catch((error) => {
  console.error('Update failed:', error.message);
  process.exit(1);
});