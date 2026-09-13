// This file seeds the database with JSS aptitude questions and their options.
import pool from './db.js';

const seedJSSQuestions = async () => {
  try {

    // Only clear JSS questions. SSS questions are untouched.
    // This matches the same safe pattern used in seedSSS.js.
    await pool.query(`
      DELETE FROM question_options
      WHERE question_id IN (
        SELECT id FROM aptitude_questions WHERE level = 'JSS'
      );
    `);

    await pool.query(`
      DELETE FROM aptitude_questions WHERE level = 'JSS';
    `);

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

    const ids = questionsResult.rows.map(row => row.id);
    const [q1, q2, q3, q4, q5, q6, q7, q8, q9, q10] = ids;

    // Insert options using the actual returned IDs, not positional $1..$10
    // placeholders against a template literal, since that mismatch is what
    // the previous version of this file was quietly at risk of.
    await pool.query(`
      INSERT INTO question_options (question_id, option_text, weight_science, weight_arts, weight_commercial) VALUES

        (${q1}, 'Solving puzzles, playing chess, or doing math games', 2, 0, 0),
        (${q1}, 'Reading novels, writing stories, or drawing', 0, 2, 0),
        (${q1}, 'Counting money, selling things, or planning how to make profit', 0, 0, 2),

        (${q2}, 'Mathematics or Basic Science', 2, 0, 0),
        (${q2}, 'English, CRS, or Social Studies', 0, 2, 0),
        (${q2}, 'Business Studies or Economics', 0, 0, 2),

        (${q3}, 'Science and Technology Club', 2, 0, 0),
        (${q3}, 'Drama, Debate, or Press Club', 0, 2, 0),
        (${q3}, 'Junior Achievement or Entrepreneur Club', 0, 0, 2),

        (${q4}, 'Think through it logically and look for a pattern', 2, 0, 0),
        (${q4}, 'Talk it out, write about it, or find a creative angle', 0, 2, 0),
        (${q4}, 'Figure out the cost, the benefit, and who gains what', 0, 0, 2),

        (${q5}, 'Engineer, Doctor, or Scientist', 2, 0, 0),
        (${q5}, 'Lawyer, Journalist, or Artist', 0, 2, 0),
        (${q5}, 'Banker, Entrepreneur, or Accountant', 0, 0, 2),

        (${q6}, 'Science fiction, tech, or nature documentaries', 2, 0, 0),
        (${q6}, 'Drama, courtroom, or historical films', 0, 2, 0),
        (${q6}, 'Business, hustle, or entrepreneur stories', 0, 0, 2),

        (${q7}, 'I like breaking down the problem, researching the facts, and figuring out the step-by-step logic needed to get the correct answer', 2, 0, 0),
        (${q7}, 'I enjoy leading the presentation, writing the group report, or coming up with creative ideas for the topic', 0, 2, 0),
        (${q7}, 'I prefer managing the group, assigning tasks to everyone, and making sure we finish on time without wasting resources', 0, 0, 2),

        (${q8}, 'Buy a tech gadget, a strategy or puzzle game, or a book that explains how things in nature or technology work', 2, 0, 0),
        (${q8}, 'Buy a captivating novel, trendy clothes, or tickets to a movie or cultural event', 0, 2, 0),
        (${q8}, 'Put it in my savings box, or buy some snacks or goods to resell to classmates and make a profit', 0, 0, 2),

        (${q9}, 'I try to look at the facts calmly and look for clear logical proof to see who is right and what makes sense', 2, 0, 0),
        (${q9}, 'I use strong speaking skills to explain my perspective, or I write a long message expressing exactly how I feel', 0, 2, 0),
        (${q9}, 'I try to negotiate a deal or compromise where both sides win something so we can get back to normal', 0, 0, 2),

        (${q10}, 'A science and technology center, a weather station, or a nature research park', 2, 0, 0),
        (${q10}, 'The National Theatre, a famous historical museum, or a media or radio broadcasting studio', 0, 2, 0),
        (${q10}, 'The Nigerian Stock Exchange, a large automated factory, or the headquarters of a major commercial bank', 0, 0, 2);
    `);

    console.log('JSS questions and options seeded successfully');
    process.exit(0);

  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
};

seedJSSQuestions();