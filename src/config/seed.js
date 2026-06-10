// This file seeds the database with JSS aptitude questions and their options.


import pool from './db.js';

const seedJSSQuestions = async () => {
  try {

    await pool.query(`TRUNCATE TABLE question_options, aptitude_questions RESTART IDENTITY CASCADE;`);

    // Insert all 10 JSS questions first
    const questionsResult = await pool.query(`
      INSERT INTO aptitude_questions (question_text, level, category) VALUES
        ('When you have free time at home, what do you most enjoy doing?', 'JSS', 'interests'),
        ('Which subject feels the least like work to you?', 'JSS', 'academic'),
        ('Your school is organising a club. Which one do you join?', 'JSS', 'interests'),
        ('A problem needs to be solved in your class. What is your first instinct?', 'JSS', 'thinking_style'),
        ('Which of these jobs sounds most exciting to you right now?', 'JSS', 'career'),
        ('What kind of movies or TV shows do you enjoy most?', 'JSS', 'interests'),
        ('When your teacher divides the class into groups for a project, what role do you naturally find yourself taking?', 'JSS', 'behaviour'),
        ('If you are given a surprise cash gift of ₦10,000, what is the very first thing you would want to do with it?', 'JSS', 'behaviour'),
        ('When you have a serious disagreement or argument with a classmate, how do you usually try to settle it?', 'JSS', 'thinking_style'),
        ('If the principal announces a school excursion, which destination would you be most excited to visit?', 'JSS', 'interests')
      RETURNING id;
    `);

    // Extract the IDs of the inserted questions in order
    const ids = questionsResult.rows.map(row => row.id);

    // Insert options for each question using the returned IDs
    await pool.query(`
      INSERT INTO question_options (question_id, option_text, weight_science, weight_arts, weight_commercial) VALUES

        -- Q1: Free time
        ($1, 'Solving puzzles, playing chess, or doing math games', 2, 0, 0),
        ($1, 'Reading novels, writing stories, or drawing', 0, 2, 0),
        ($1, 'Counting money, selling things, or planning how to make profit', 0, 0, 2),

        -- Q2: Favourite subject
        ($2, 'Mathematics or Basic Science', 2, 0, 0),
        ($2, 'English, CRS, or Social Studies', 0, 2, 0),
        ($2, 'Business Studies or Economics', 0, 0, 2),

        -- Q3: School club
        ($3, 'Science and Technology Club', 2, 0, 0),
        ($3, 'Drama, Debate, or Press Club', 0, 2, 0),
        ($3, 'Junior Achievement or Entrepreneur Club', 0, 0, 2),

        -- Q4: Problem solving
        ($4, 'Think through it logically and look for a pattern', 2, 0, 0),
        ($4, 'Talk it out, write about it, or find a creative angle', 0, 2, 0),
        ($4, 'Figure out the cost, the benefit, and who gains what', 0, 0, 2),

        -- Q5: Exciting job
        ($5, 'Engineer, Doctor, or Scientist', 2, 0, 0),
        ($5, 'Lawyer, Journalist, or Artist', 0, 2, 0),
        ($5, 'Banker, Entrepreneur, or Accountant', 0, 0, 2),

        -- Q6: Movies
        ($6, 'Science fiction, tech, or nature documentaries', 2, 0, 0),
        ($6, 'Drama, courtroom, or historical films', 0, 2, 0),
        ($6, 'Business, hustle, or entrepreneur stories', 0, 0, 2),

        -- Q7: Group project role
        ($7, 'I like breaking down the problem, researching the facts, and figuring out the step-by-step logic needed to get the correct answer', 2, 0, 0),
        ($7, 'I enjoy leading the presentation, writing the group report, or coming up with creative ideas for the topic', 0, 2, 0),
        ($7, 'I prefer managing the group, assigning tasks to everyone, and making sure we finish on time without wasting resources', 0, 0, 2),

        -- Q8: ₦10,000 gift
        ($8, 'Buy a tech gadget, a strategy or puzzle game, or a book that explains how things in nature or technology work', 2, 0, 0),
        ($8, 'Buy a captivating novel, trendy clothes, or tickets to a movie or cultural event', 0, 2, 0),
        ($8, 'Put it in my savings box, or buy some snacks or goods to resell to classmates and make a profit', 0, 0, 2),

        -- Q9: Handling arguments
        ($9, 'I try to look at the facts calmly and look for clear logical proof to see who is right and what makes sense', 2, 0, 0),
        ($9, 'I use strong speaking skills to explain my perspective, or I write a long message expressing exactly how I feel', 0, 2, 0),
        ($9, 'I try to negotiate a deal or compromise where both sides win something so we can get back to normal', 0, 0, 2),

        -- Q10: School excursion
        ($10, 'A science and technology center, a weather station, or a nature research park', 2, 0, 0),
        ($10, 'The National Theatre, a famous historical museum, or a media or radio broadcasting studio', 0, 2, 0),
        ($10, 'The Nigerian Stock Exchange, a large automated factory, or the headquarters of a major commercial bank', 0, 0, 2);

    `, ids);

    console.log('JSS questions and options seeded successfully');
    process.exit(0);

  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
};

seedJSSQuestions();