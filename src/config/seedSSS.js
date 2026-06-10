import pool from './db.js';

const seedSSSQuestions = async () => {
  try {

    // Only truncate SSS questions. JSS questions are safe.
    await pool.query(`
  DELETE FROM question_options
  WHERE question_id IN (
    SELECT id FROM aptitude_questions WHERE level = 'SSS'
  );
`);

await pool.query(`
  DELETE FROM aptitude_questions WHERE level = 'SSS';
`);

    const questionsResult = await pool.query(`
      INSERT INTO aptitude_questions (question_text, level, category) VALUES
        ('When you imagine yourself at work ten years from now, which environment feels most like you?', 'SSS', 'career'),
        ('A major problem has just been announced in your community. Which role do you naturally want to play?', 'SSS', 'thinking_style'),
        ('Which of these activities could you do for hours without getting bored?', 'SSS', 'interests'),
        ('Your school gives every student a free elective slot. Which course do you pick?', 'SSS', 'academic'),
        ('Which of these real-world problems genuinely makes you angry enough to want to fix it?', 'SSS', 'motivation'),
        ('A close friend is applying to university and asks for your honest advice. What do you tell them?', 'SSS', 'thinking_style'),
        ('Which kind of project would you be most proud to show at a graduation exhibition?', 'SSS', 'interests'),
        ('You are given six months and unlimited resources to learn one thing deeply. What do you choose?', 'SSS', 'interests'),
        ('Which of these university experiences excites you the most?', 'SSS', 'career'),
        ('How do you prefer to convince someone that your idea is correct?', 'SSS', 'thinking_style'),
        ('Which of these news headlines would make you stop scrolling immediately?', 'SSS', 'interests'),
        ('A startup offers you an internship. Which role do you take?', 'SSS', 'career'),
        ('Which of these skills do people already say you are unusually good at?', 'SSS', 'behaviour'),
        ('You have one year after secondary school before university. How do you spend it?', 'SSS', 'behaviour'),
        ('Which sentence best describes how you want your career to matter?', 'SSS', 'motivation')
      RETURNING id;
    `);

    const ids = questionsResult.rows.map(row => row.id);

    const [q1,q2,q3,q4,q5,q6,q7,q8,q9,q10,q11,q12,q13,q14,q15] = ids;

await pool.query(`
  INSERT INTO question_options (question_id, option_text, weight_science, weight_arts, weight_commercial) VALUES

    -- Q1: Work environment
    (${q1}, 'A hospital, laboratory, engineering site, or research centre where I work with data, systems, or the human body', 2, 0, 0),
    (${q1}, 'A courtroom, newsroom, publishing house, or creative studio where I work with words, people, and ideas', 0, 2, 0),
    (${q1}, 'A bank, corporate office, trading floor, or business headquarters where I work with money, strategy, and markets', 0, 0, 2),

    (${q2}, 'I want to design or build a solution, whether that is a medical treatment, an engineering fix, or a scientific investigation', 2, 0, 0),
    (${q2}, 'I want to speak out, write about it, or advocate for the people affected and make sure their story is heard', 0, 2, 0),
    (${q2}, 'I want to organise a response, manage the resources available, and figure out the most cost-effective way to help', 0, 0, 2),

    (${q3}, 'Running experiments, writing code, solving technical problems, or reading about how the human body or physical world works', 2, 0, 0),
    (${q3}, 'Reading deeply, writing essays or stories, debating complex topics, or analysing how societies and cultures work', 0, 2, 0),
    (${q3}, 'Tracking financial data, studying how markets move, building business plans, or learning about how companies grow', 0, 0, 2),

    (${q4}, 'Introduction to Programming, Applied Biology, Engineering Drawing, or Statistics', 2, 0, 0),
    (${q4}, 'Creative Writing, Public Speaking and Debate, Nigerian History and Politics, or Media Studies', 0, 2, 0),
    (${q4}, 'Principles of Accounting, Introduction to Economics, Business Communication, or Financial Literacy', 0, 0, 2),

    (${q5}, 'Poor healthcare access, bad infrastructure, environmental destruction, or technology gaps holding Nigeria back', 2, 0, 0),
    (${q5}, 'Injustice in the legal system, lack of press freedom, cultural erasure, or young people with no voice or platform', 0, 2, 0),
    (${q5}, 'Youth unemployment, financial exclusion, corruption in business, or people unable to access credit or grow their money', 0, 0, 2),

    (${q6}, 'I would tell them to follow what they are naturally curious about and match it to a course with real career demand in Nigeria', 2, 0, 0),
    (${q6}, 'I would ask them what kind of impact they want to have on people and society, and let that guide the course choice', 0, 2, 0),
    (${q6}, 'I would look at which courses lead to the highest-paying careers and strongest job market in Nigeria right now', 0, 0, 2),

    (${q7}, 'A working software application, a medical research poster, an engineering prototype, or a scientific experiment with real results', 2, 0, 0),
    (${q7}, 'A short film, a published essay collection, a moot court performance, or a documentary about a social issue in Nigeria', 0, 2, 0),
    (${q7}, 'A full business plan with financial projections, a mock investment portfolio, or a market research report on a Nigerian industry', 0, 0, 2),

    (${q8}, 'Advanced mathematics, human anatomy, software engineering, or how to build and test physical or digital systems', 2, 0, 0),
    (${q8}, 'Legal theory and argumentation, media production, advanced writing and rhetoric, or the history of civilisations', 0, 2, 0),
    (${q8}, 'Financial modelling, marketing strategy, accounting principles, or how global and Nigerian financial markets actually work', 0, 0, 2),

    (${q9}, 'Conducting research in a lab, building systems in a studio, solving clinical problems during hospital rotations', 2, 0, 0),
    (${q9}, 'Competing in moot courts, writing for the faculty journal, performing in a theatre production, or leading a campus media outlet', 0, 2, 0),
    (${q9}, 'Winning a business plan competition, completing a finance internship, building a startup, or landing a consulting project', 0, 0, 2),

    (${q10}, 'I use data, research findings, logical step-by-step reasoning, and hard evidence to show exactly why I am right', 2, 0, 0),
    (${q10}, 'I tell a compelling story, appeal to shared values, use persuasive language, and make people feel the importance of the idea', 0, 2, 0),
    (${q10}, 'I present numbers, show costs and benefits clearly, and demonstrate the practical return on accepting my position', 0, 0, 2),

    (${q11}, '"Nigerian Scientist Develops Malaria Vaccine Using Local Compounds" or "OAU Engineers Build Solar Powered Water System for Rural Communities"', 2, 0, 0),
    (${q11}, '"Supreme Court Overturns Landmark Judgment in Historic Case" or "Nigerian Writer Wins International Booker Prize"', 0, 2, 0),
    (${q11}, '"Nigerian Fintech Startup Raises 50 Million Dollars in Series B Funding" or "CBN Launches New Policy to Boost Youth Financial Inclusion"', 0, 0, 2),

    (${q12}, 'Junior software developer, laboratory research assistant, or engineering site analyst', 2, 0, 0),
    (${q12}, 'Content writer, legal research intern, communications associate, or social media storyteller', 0, 2, 0),
    (${q12}, 'Finance analyst intern, business development associate, or marketing strategy assistant', 0, 0, 2),

    (${q13}, 'Figuring out how things work, spotting patterns in data, solving technical problems others give up on', 2, 0, 0),
    (${q13}, 'Writing clearly and persuasively, speaking confidently in public, or understanding people and situations quickly', 0, 2, 0),
    (${q13}, 'Managing money carefully, spotting business opportunities, organising resources, or negotiating outcomes', 0, 0, 2),

    (${q14}, 'Teaching myself to code, volunteering at a hospital or clinic, or taking an online course in science or engineering', 2, 0, 0),
    (${q14}, 'Writing a blog or starting a podcast, reading widely across law, history, and literature, or volunteering with a media organisation', 0, 2, 0),
    (${q14}, 'Starting a small business, learning financial modelling, completing an accounting or business certificate, or interning at a bank', 0, 0, 2),

    (${q15}, 'I want to solve problems that improve how people live, whether through medicine, technology, infrastructure, or science', 2, 0, 0),
    (${q15}, 'I want to give people a voice, protect their rights, tell their stories, or shape how society understands itself', 0, 2, 0),
    (${q15}, 'I want to build wealth, create jobs, and drive the kind of economic growth that makes Nigeria more competitive globally', 0, 0, 2)
`);
    console.log('SSS questions and options seeded successfully');
    console.log('Options inserted successfully');
    process.exit(0);

  } catch (optionsError) {
    console.error('Options insert failed:', optionsError.message);
    process.exit(1);
}
};

seedSSSQuestions();