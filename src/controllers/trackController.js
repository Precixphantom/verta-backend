// Draft content copied from the sprint plan. It is NOT verified against official sources yet.
const TRACK_CONTENT = { // one object holding all three tracks, keyed by lowercase name
  science: { // lowercase key so the lookup below is not case sensitive
    title: 'Science', // the label the frontend shows on the tab
    key_facts: [ // exactly 4 short facts, as the data contract asks
      'Science is one of the three senior secondary tracks in Nigeria.', // fact 1
      'It is built around subjects such as Mathematics, Physics, Chemistry and Biology.', // fact 2
      'It leads to engineering, computing, health and applied science courses.', // fact 3
      'Final exams are WAEC or NECO, then JAMB for university entry.' // fact 4
    ],
    courses: [ // exactly 8 example courses, shown as chips
      'Computer Science', 'Computer Engineering', 'Electrical and Electronics Engineering', // courses 1 to 3
      'Mechanical Engineering', 'Medicine and Surgery', 'Pharmacy', 'Nursing', 'Biochemistry' // courses 4 to 8
    ]
  },
  arts: { // second track
    title: 'Arts', // tab label
    key_facts: [ // 4 facts
      'Arts is one of the three senior secondary tracks in Nigeria.', // fact 1
      'It is built around subjects such as Literature in English, Government, History and religious studies.', // fact 2
      'It leads to law, language, media and humanities courses.', // fact 3
      'Final exams are WAEC or NECO, then JAMB for university entry.' // fact 4
    ],
    courses: [ // 8 courses
      'Law', 'English and Literary Studies', 'Mass Communication', 'History and International Studies', // courses 1 to 4
      'Philosophy', 'Theatre Arts', 'Linguistics', 'Religious Studies' // courses 5 to 8
    ]
  },
  commercial: { // third track
    title: 'Commercial', // tab label
    key_facts: [ // 4 facts
      'Commercial is one of the three senior secondary tracks in Nigeria.', // fact 1
      'It is built around subjects such as Economics, Accounting, Commerce and Business studies.', // fact 2
      'It leads to business, finance and management courses.', // fact 3
      'Final exams are WAEC or NECO, then JAMB for university entry.' // fact 4
    ],
    courses: [ // 8 courses
      'Accounting', 'Business Administration', 'Banking and Finance', 'Economics', // courses 1 to 4
      'Marketing', 'Insurance', 'Entrepreneurship', 'Public Administration' // courses 5 to 8
    ]
  }
};

// GET /api/tracks/:track
export const getTrackContent = (req, res) => { // no async needed because nothing is awaited
  const key = String(req.params.track).toLowerCase(); // "Science", "SCIENCE" and "science" all work
  const content = TRACK_CONTENT[key]; // undefined if the name is not one of the three

  if (!content) { // a wrong track name should get a clear answer, not a crash
    return res.status(400).json({ error: 'Track must be Science, Commercial or Arts' }); // 400 means the request was wrong
  }

  res.status(200).json({ // success response
    ...content, // spread copies title, key_facts and courses into the response
    sources: [], // the data contract wants this field, empty until the content owner adds sources
    verified: false // tells the frontend this content has not been checked, so it should not say "verified"
  });
};