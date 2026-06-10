import pool from './db.js';

const seedUniversities = async () => {
  try {
    await pool.query(`
      TRUNCATE TABLE course_university, universities RESTART IDENTITY CASCADE;
    `);

    const universitiesResult = await pool.query(`
      INSERT INTO universities (name, state, accreditation_status, type) VALUES
        ('University of Lagos (UNILAG)',              'Lagos',  'Accredited', 'Federal'),
        ('University of Ibadan (UI)',                 'Oyo',    'Accredited', 'Federal'),
        ('Obafemi Awolowo University (OAU)',          'Osun',   'Accredited', 'Federal'),
        ('University of Nigeria Nsukka (UNN)',        'Enugu',  'Accredited', 'Federal'),
        ('Ahmadu Bello University (ABU)',             'Kaduna', 'Accredited', 'Federal'),
        ('Lagos State University (LASU)',             'Lagos',  'Accredited', 'State'),
        ('Olabisi Onabanjo University (OOU)',         'Ogun',   'Accredited', 'State'),
        ('Ambrose Alli University (AAU)',             'Edo',    'Accredited', 'State'),
        ('Prince Abubakar Audu University (PAAU)',   'Kogi',   'Accredited', 'State'),
        ('Osun State University (UNIOSUN)',           'Osun',   'Accredited', 'State'),
        ('Covenant University (CU)',                  'Ogun',   'Accredited', 'Private'),
        ('Babcock University (BU)',                   'Ogun',   'Accredited', 'Private'),
        ('Landmark University (LU)',                  'Kwara',  'Accredited', 'Private'),
        ('Pan-Atlantic University (PAU)',             'Lagos',  'Accredited', 'Private'),
        ('Bowen University (BU)',                     'Osun',   'Accredited', 'Private')
      RETURNING id, name;
    `);

    console.log('Universities seeded:');
    universitiesResult.rows.forEach(row => console.log(` - [${row.id}] ${row.name}`));

    const uniMap = {};
    universitiesResult.rows.forEach(row => { uniMap[row.name] = row.id; });
    const u = uniMap;

    // 255 rows — all 17 courses × 15 universities
    // Course IDs match seed order above:
    // 1=Medicine & Surgery, 2=Computer Science, 3=Nursing Science,
    // 4=Civil Engineering, 5=Mechanical Engineering, 6=Microbiology,
    // 7=Mathematics, 8=Law, 9=Mass Communication, 10=English Language,
    // 11=Theatre Arts, 12=History & International Relations, 13=Accounting,
    // 14=Economics, 15=Banking & Finance, 16=Marketing, 17=Business Administration

    await pool.query(`
      INSERT INTO course_university (course_id, university_id, utme_cutoff, post_utme_cutoff) VALUES
        -- Medicine & Surgery
        (1, $1,  276, 82.4), (1, $2,  265, 80.1), (1, $3,  255, 79.5), (1, $4,  245, 76.8),
        (1, $5,  235, 74.5), (1, $6,  240, 78.0), (1, $7,  230, 75.0), (1, $8,  225, 73.5),
        (1, $9,  220, 70.0), (1, $10, 228, 74.0), (1, $11, 250, 81.0), (1, $12, 245, 79.0),
        (1, $13, 235, 76.0), (1, $14, 230, 75.0), (1, $15, 225, 74.0),

        -- Computer Science
        (2, $1,  254, 78.5), (2, $2,  245, 75.0), (2, $3,  240, 73.2), (2, $4,  235, 71.5),
        (2, $5,  220, 68.0), (2, $6,  225, 72.0), (2, $7,  215, 69.5), (2, $8,  210, 67.0),
        (2, $9,  200, 65.0), (2, $10, 212, 68.5), (2, $11, 230, 74.0), (2, $12, 225, 72.0),
        (2, $13, 215, 69.0), (2, $14, 210, 68.0), (2, $15, 205, 67.0),

        -- Nursing Science
        (3, $1,  268, 80.5), (3, $2,  255, 78.0), (3, $3,  250, 76.5), (3, $4,  240, 74.2),
        (3, $5,  230, 71.0), (3, $6,  235, 75.5), (3, $7,  225, 72.0), (3, $8,  220, 70.5),
        (3, $9,  215, 68.0), (3, $10, 222, 71.5), (3, $11, 240, 77.0), (3, $12, 235, 75.0),
        (3, $13, 225, 72.0), (3, $14, 220, 71.0), (3, $15, 215, 70.0),

        -- Civil Engineering
        (4, $1,  242, 75.6), (4, $2,  235, 72.5), (4, $3,  230, 70.8), (4, $4,  225, 69.5),
        (4, $5,  215, 66.0), (4, $6,  220, 68.5), (4, $7,  210, 65.5), (4, $8,  205, 64.0),
        (4, $9,  195, 62.0), (4, $10, 208, 65.0), (4, $11, 225, 71.0), (4, $12, 220, 69.0),
        (4, $13, 210, 66.0), (4, $14, 205, 65.0), (4, $15, 200, 64.0),

        -- Mechanical Engineering
        (5, $1,  245, 76.2), (5, $2,  238, 73.5), (5, $3,  235, 72.0), (5, $4,  228, 70.5),
        (5, $5,  220, 67.5), (5, $6,  225, 69.8), (5, $7,  215, 66.5), (5, $8,  210, 65.0),
        (5, $9,  200, 63.5), (5, $10, 212, 66.0), (5, $11, 230, 72.0), (5, $12, 225, 70.0),
        (5, $13, 215, 67.0), (5, $14, 210, 66.0), (5, $15, 205, 65.0),

        -- Microbiology
        (6, $1,  215, 68.5), (6, $2,  205, 65.2), (6, $3,  200, 63.8), (6, $4,  195, 62.0),
        (6, $5,  185, 59.5), (6, $6,  190, 61.0), (6, $7,  180, 58.5), (6, $8,  175, 57.0),
        (6, $9,  170, 55.0), (6, $10, 178, 58.0), (6, $11, 195, 64.0), (6, $12, 190, 62.0),
        (6, $13, 180, 59.0), (6, $14, 175, 58.0), (6, $15, 170, 57.0),

        -- Mathematics
        (7, $1,  208, 66.0), (7, $2,  195, 63.5), (7, $3,  190, 62.0), (7, $4,  185, 60.5),
        (7, $5,  175, 58.0), (7, $6,  180, 59.5), (7, $7,  170, 57.0), (7, $8,  165, 55.5),
        (7, $9,  160, 54.0), (7, $10, 168, 56.5), (7, $11, 185, 62.0), (7, $12, 180, 60.0),
        (7, $13, 170, 57.0), (7, $14, 165, 56.0), (7, $15, 160, 55.0),

        -- Law
        (8, $1,  272, 81.5), (8, $2,  260, 78.8), (8, $3,  255, 77.5), (8, $4,  248, 75.0),
        (8, $5,  235, 72.5), (8, $6,  245, 76.0), (8, $7,  235, 73.5), (8, $8,  230, 72.0),
        (8, $9,  225, 69.5), (8, $10, 232, 73.0), (8, $11, 250, 79.0), (8, $12, 245, 77.0),
        (8, $13, 235, 74.0), (8, $14, 230, 73.0), (8, $15, 225, 72.0),

        -- Mass Communication
        (9, $1,  238, 74.5), (9, $2,  230, 71.2), (9, $3,  225, 69.8), (9, $4,  220, 68.5),
        (9, $5,  210, 65.0), (9, $6,  215, 67.5), (9, $7,  205, 64.5), (9, $8,  200, 63.0),
        (9, $9,  190, 61.0), (9, $10, 202, 64.0), (9, $11, 225, 70.0), (9, $12, 220, 68.0),
        (9, $13, 210, 65.0), (9, $14, 205, 64.0), (9, $15, 200, 63.0),

        -- English Language
        (10, $1,  212, 67.0), (10, $2,  200, 64.5), (10, $3,  195, 63.0), (10, $4,  190, 61.5),
        (10, $5,  180, 59.0), (10, $6,  185, 60.5), (10, $7,  175, 58.0), (10, $8,  170, 56.5),
        (10, $9,  165, 54.5), (10, $10, 172, 57.5), (10, $11, 190, 63.0), (10, $12, 185, 61.0),
        (10, $13, 175, 58.0), (10, $14, 170, 57.0), (10, $15, 165, 56.0),

        -- Theatre Arts
        (11, $1,  210, 66.5), (11, $2,  198, 64.0), (11, $3,  192, 62.5), (11, $4,  188, 61.0),
        (11, $5,  178, 58.5), (11, $6,  182, 60.0), (11, $7,  172, 57.5), (11, $8,  168, 56.0),
        (11, $9,  162, 54.0), (11, $10, 170, 57.0), (11, $11, 188, 62.5), (11, $12, 182, 60.5),
        (11, $13, 172, 57.5), (11, $14, 168, 56.5), (11, $15, 162, 55.0),

        -- History & International Relations
        (12, $1,  220, 69.5), (12, $2,  210, 66.8), (12, $3,  205, 65.5), (12, $4,  200, 64.0),
        (12, $5,  190, 61.5), (12, $6,  195, 63.0), (12, $7,  185, 60.5), (12, $8,  180, 59.0),
        (12, $9,  175, 57.0), (12, $10, 182, 60.0), (12, $11, 205, 66.0), (12, $12, 200, 64.0),
        (12, $13, 190, 61.0), (12, $14, 185, 60.0), (12, $15, 180, 59.0),

        -- Accounting
        (13, $1,  240, 75.0), (13, $2,  232, 72.0), (13, $3,  228, 70.5), (13, $4,  222, 69.0),
        (13, $5,  212, 65.5), (13, $6,  218, 68.0), (13, $7,  208, 65.0), (13, $8,  202, 63.5),
        (13, $9,  192, 61.5), (13, $10, 205, 64.5), (13, $11, 228, 71.0), (13, $12, 222, 69.0),
        (13, $13, 212, 66.0), (13, $14, 208, 65.0), (13, $15, 202, 64.0),

        -- Economics
        (14, $1,  236, 73.8), (14, $2,  228, 70.5), (14, $3,  222, 69.2), (14, $4,  218, 67.8),
        (14, $5,  208, 64.5), (14, $6,  212, 66.5), (14, $7,  202, 63.8), (14, $8,  198, 62.0),
        (14, $9,  188, 60.0), (14, $10, 200, 63.0), (14, $11, 222, 70.0), (14, $12, 218, 68.0),
        (14, $13, 208, 65.0), (14, $14, 202, 64.0), (14, $15, 198, 63.0),

        -- Banking & Finance
        (15, $1,  225, 70.8), (15, $2,  218, 67.5), (15, $3,  212, 66.2), (15, $4,  208, 64.8),
        (15, $5,  198, 61.5), (15, $6,  202, 63.5), (15, $7,  192, 60.5), (15, $8,  188, 59.0),
        (15, $9,  178, 57.0), (15, $10, 190, 60.0), (15, $11, 212, 66.5), (15, $12, 208, 64.5),
        (15, $13, 198, 61.5), (15, $14, 192, 60.5), (15, $15, 188, 59.5),

        -- Marketing
        (16, $1,  222, 69.5), (16, $2,  215, 66.8), (16, $3,  210, 65.0), (16, $4,  205, 63.5),
        (16, $5,  195, 60.5), (16, $6,  200, 62.0), (16, $7,  190, 59.5), (16, $8,  185, 58.0),
        (16, $9,  175, 56.0), (16, $10, 188, 59.0), (16, $11, 210, 65.5), (16, $12, 205, 63.5),
        (16, $13, 195, 60.5), (16, $14, 190, 59.5), (16, $15, 185, 58.5),

        -- Business Administration
        (17, $1,  228, 71.5), (17, $2,  220, 68.5), (17, $3,  215, 67.0), (17, $4,  210, 65.5),
        (17, $5,  200, 62.5), (17, $6,  205, 64.0), (17, $7,  195, 61.5), (17, $8,  190, 60.0),
        (17, $9,  180, 58.0), (17, $10, 192, 61.0), (17, $11, 215, 67.5), (17, $12, 210, 65.5),
        (17, $13, 200, 62.5), (17, $14, 195, 61.5), (17, $15, 190, 60.5);
    `, [
      u['University of Lagos (UNILAG)'],
      u['University of Ibadan (UI)'],
      u['Obafemi Awolowo University (OAU)'],
      u['University of Nigeria Nsukka (UNN)'],
      u['Ahmadu Bello University (ABU)'],
      u['Lagos State University (LASU)'],
      u['Olabisi Onabanjo University (OOU)'],
      u['Ambrose Alli University (AAU)'],
      u['Prince Abubakar Audu University (PAAU)'],
      u['Osun State University (UNIOSUN)'],
      u['Covenant University (CU)'],
      u['Babcock University (BU)'],
      u['Landmark University (LU)'],
      u['Pan-Atlantic University (PAU)'],
      u['Bowen University (BU)']
    ]);

    console.log('Course-university links seeded: 255 rows');
    process.exit(0);

  } catch (error) {
    console.error('University seeding failed:', error.message);
    process.exit(1);
  }
};

seedUniversities();