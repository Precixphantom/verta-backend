// Draft content from the sprint plan. NOT verified against official sources yet.
const ROADMAP = [ // the steps in the order the student sees them
  { title: 'Phase 1: Olu and course database', description: 'Olu answers questions using our course and university data.', status: 'done', message: null }, // finished, so no locked message
  { title: 'Phase 2: Assessment and profile', description: 'The interest test, your results and your profile.', status: 'done', message: null }, // finished too
  { title: 'Universities for your course', description: 'See the universities that offer your chosen course.', status: 'locked', message: 'Soon you will see universities that offer your chosen course. Arrives in Phase 3.' }, // shown when the locked card is clicked
  { title: 'JAMB subjects and cutoff', description: 'See the JAMB subject combination and cutoff mark for your course.', status: 'locked', message: 'Soon you will see the JAMB subject combination and cutoff mark for your course. Arrives in Phase 3.' }, // locked
  { title: 'Post UTME or screening', description: 'See what each university requires for screening.', status: 'locked', message: 'Screening rules differ from one university to another, so we will show what each one requires. Arrives in Phase 3.' }, // says "differ", never claims one rule for all
  { title: 'Skills Hub', description: 'Skills that apply to every field.', status: 'locked', message: 'Skills for every field: leadership, communication, data and tech basics. Preview only for now.' } // preview only
];

const SKILLS = { // two groups, as the data contract asks
  soft_skills: [ // skills useful in any career
    { name: 'Leadership', description: 'Guiding a group towards a goal and taking responsibility for the result.' }, // skill 1
    { name: 'Communication', description: 'Explaining ideas clearly, in speech and in writing, and listening well.' }, // skill 2
    { name: 'Teamwork', description: 'Working with other people so the whole group does better.' }, // skill 3
    { name: 'Time management', description: 'Planning your work so important things get done on time.' } // skill 4
  ],
  technical_skills: [ // skills tied to tools and data
    { name: 'Data analysis', description: 'Reading numbers and tables to find useful answers.' }, // skill 1
    { name: 'Basic tech skills', description: 'Using computers, the internet and common software with confidence.' }, // skill 2
    { name: 'Machine learning', description: 'Teaching computers to find patterns from examples.' }, // skill 3
    { name: 'AI', description: 'Understanding what AI tools can and cannot do, and using them well.' } // skill 4
  ]
};

// GET /api/roadmap
export const getRoadmap = (req, res) => { // no async because nothing is awaited
  res.status(200).json({ steps: ROADMAP }); // wrapped in an object so more fields can be added later without breaking the frontend
};

// GET /api/skills
export const getSkills = (req, res) => { // same idea, different content
  res.status(200).json({ ...SKILLS, note: 'Skills apply to every field. They are not tied to your course.', verified: false }); // the note is the line the sprint plan wants on the Skills Hub
};