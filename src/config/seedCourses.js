import pool from './db.js';

const seedCourses = async () => {
  try {
    await pool.query(`TRUNCATE TABLE course_university, courses RESTART IDENTITY CASCADE;`);

    const coursesResult = await pool.query(`
      INSERT INTO courses (name, description, jamb_combination, salary_range, career_paths) VALUES
        (
          'Medicine & Surgery',
          'Medicine & Surgery teaches you about the human body in extreme detail showing you how to diagnose complex illnesses perform surgeries and save lives.',
          'English, Biology, Chemistry, Physics',
          '₦200,000 - ₦400,000 per month',
          'Medical Doctor, Surgeon, Healthcare Administrator'
        ),
        (
          'Computer Science',
          'Computer Science trains you to write code build software applications and use smart algorithms to solve real-world technology problems.',
          'English, Mathematics, Physics, Chemistry',
          '₦150,000 - ₦350,000 per month',
          'Software Engineer, Data Scientist, Systems Analyst'
        ),
        (
          'Nursing Science',
          'Nursing Science prepares you for advanced patient care clinical medical procedures and managing healthcare environments in hospitals.',
          'English, Biology, Chemistry, Physics',
          '₦120,000 - ₦250,000 per month',
          'Registered Nurse, Public Health Nurse, Clinic Supervisor'
        ),
        (
          'Civil Engineering',
          'Civil Engineering shows you how to design plan construct and maintain large structures like roads bridges dams and high-rise buildings.',
          'English, Mathematics, Physics, Chemistry',
          '₦120,000 - ₦280,000 per month',
          'Structural Engineer, Project Manager, Site Engineer'
        ),
        (
          'Mechanical Engineering',
          'Mechanical Engineering focuses on how to design manufacture and maintain mechanical systems heavy industrial machinery and automated engines.',
          'English, Mathematics, Physics, Chemistry',
          '₦130,000 - ₦300,000 per month',
          'Mechanical Engineer, Plant Manager, Design Engineer'
        ),
        (
          'Microbiology',
          'Microbiology investigates microscopic organisms like bacteria viruses and fungi exploring how they affect human health and scientific research.',
          'English, Biology, Chemistry, Physics',
          '₦100,000 - ₦250,000 per month',
          'Microbiologist, Clinical Lab Technologist, Research Scientist'
        ),
        (
          'Mathematics',
          'Mathematics explores advanced numerical theories logical problem-solving and calculation models used in finance technology and engineering.',
          'English, Mathematics, Physics, Chemistry, Economics',
          '₦100,000 - ₦280,000 per month',
          'Data Analyst, Actuary, Mathematician, Financial Modeler'
        ),
        (
          'Law',
          'Law studies the legal systems human rights and rules that govern society training you to defend clients or draft contracts for businesses.',
          'English, Literature in English, Government, any Arts subject',
          '₦100,000 - ₦250,000 per month',
          'Lawyer, Corporate Counsel, Legal Advisor, Magistrate'
        ),
        (
          'Mass Communication',
          'Mass Communication focuses on media broadcasting journalism advertising public relations and how information spreads through media channels.',
          'English, Literature in English, any two Arts or Social Sciences',
          '₦80,000 - ₦180,000 per month',
          'Journalist, PR Specialist, News Broadcaster, Content Creator'
        ),
        (
          'English Language',
          'English Language analyzes the deep structure grammar history and literature of English to master professional writing and communications.',
          'English, Literature in English, Government, any Arts subject',
          '₦70,000 - ₦150,000 per month',
          'Editor, Communications Officer, Technical Writer, Publisher'
        ),
        (
          'Theatre Arts',
          'Theatre Arts develops your skills in creative storytelling acting scriptwriting live stage directing and the business side of the film industry.',
          'English, Literature in English, any two Arts subjects',
          '₦60,000 - ₦160,000 per month',
          'Actor, Director, Scriptwriter, Stage Manager'
        ),
        (
          'History & International Relations',
          'History & International Relations examines past global events foreign policies diplomatic strategies and how different country governments interact.',
          'English, History or Government, any two Arts or Social Sciences',
          '₦80,000 - ₦200,000 per month',
          'Diplomat, Foreign Policy Analyst, Intelligence Officer'
        ),
        (
          'Accounting',
          'Accounting trains you to track corporate money manage financial records perform audits calculate taxes and keep businesses legally compliant.',
          'English, Mathematics, Economics, any Social Science or Commerce subject',
          '₦100,000 - ₦250,000 per month',
          'Auditor, Accountant, Tax Consultant, Financial Controller'
        ),
        (
          'Economics',
          'Economics studies how wealth goods and services are produced and distributed teaching you to analyze financial markets and predict economic trends.',
          'English, Mathematics, Economics, Government or Geography',
          '₦100,000 - ₦220,000 per month',
          'Financial Analyst, Economist, Policy Advisor, Investment Strategist'
        ),
        (
          'Banking & Finance',
          'Banking & Finance focuses on commercial banking systems investment portfolios credit analysis and financial risk mitigation.',
          'English, Mathematics, Economics, any Social Science or Commerce subject',
          '₦100,000 - ₦240,000 per month',
          'Investment Banker, Credit Analyst, Risk Manager, Loan Officer'
        ),
        (
          'Marketing',
          'Marketing covers consumer purchasing behaviors market research brand building advertising and modern digital sales models.',
          'English, Mathematics, Economics, any Social Science or Commerce subject',
          '₦80,000 - ₦180,000 per month',
          'Brand Manager, Digital Marketer, Market Researcher, Sales Lead'
        ),
        (
          'Business Administration',
          'Business Administration teaches you organizational management corporate strategy human resources and leadership principles needed to run a business.',
          'English, Mathematics, Economics, any Social Science or Commerce subject',
          '₦90,000 - ₦200,000 per month',
          'Business Manager, Operations Analyst, HR Specialist'
        )
      RETURNING id, name;
    `);

    console.log('Courses seeded:');
    coursesResult.rows.forEach(row => console.log(` - [${row.id}] ${row.name}`));
    process.exit(0);

  } catch (error) {
    console.error('Course seeding failed:', error.message);
    process.exit(1);
  }
};

seedCourses();