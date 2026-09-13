import pool from './src/config/db.js';

// Adds the missing piece the scoring endpoint needs: which track each
// course belongs to, confirmed with the team, not guessed.

const trackByCourse = {
  'Civil Engineering': 'Science',
  'Computer Science': 'Science',
  'Mathematics': 'Science',
  'Mechanical Engineering': 'Science',
  'Medicine & Surgery': 'Science',
  'Microbiology': 'Science',
  'Nursing Science': 'Science',

  'Accounting': 'Commercial',
  'Banking & Finance': 'Commercial',
  'Business Administration': 'Commercial',
  'Economics': 'Commercial',
  'Marketing': 'Commercial',

  'English Language': 'Arts',
  'History & International Relations': 'Arts',
  'Law': 'Arts',
  'Mass Communication': 'Arts',
  'Theatre Arts': 'Arts',
};

const run = async () => {
  await pool.query(`
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS primary_track VARCHAR(20)
      CHECK (primary_track IN ('Science', 'Commercial', 'Arts'));
  `);
  console.log('Column added (or already existed)');

  let updated = 0;
  let missing = [];

  for (const [courseName, track] of Object.entries(trackByCourse)) {
    const result = await pool.query(
      'UPDATE courses SET primary_track = $1 WHERE name = $2',
      [track, courseName]
    );
    if (result.rowCount === 0) {
      missing.push(courseName);
    } else {
      updated++;
    }
  }

  console.log(`Updated: ${updated}`);
  if (missing.length > 0) {
    console.warn('No matching course found for:', missing);
  }

  // Sanity check: any course left with no track at all
  const unset = await pool.query(
    'SELECT name FROM courses WHERE primary_track IS NULL'
  );
  if (unset.rows.length > 0) {
    console.warn('Courses still missing a track:', unset.rows.map(r => r.name));
  } else {
    console.log('Every course has a track assigned.');
  }

  process.exit(0);
};

run().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});