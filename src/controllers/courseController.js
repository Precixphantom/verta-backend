import pool from '../config/db.js';

// GET /api/courses/:id
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM courses WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error('getCourseById error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/courses/:id/universities
// Optional query param: ?type=Federal | State | Private
export const getUniversitiesByCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    let query = `
      SELECT 
        u.id,
        u.name,
        u.state,
        u.type,
        u.accreditation_status,
        cu.utme_cutoff,
        cu.post_utme_cutoff
      FROM universities u
      JOIN course_university cu ON u.id = cu.university_id
      WHERE cu.course_id = $1
    `;

    const params = [id];

    if (type) {
      query += ` AND u.type = $2`;
      params.push(type);
    }

    query += ` ORDER BY cu.utme_cutoff DESC`;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No universities found for this course' });
    }

    const universities = result.rows.map(u => ({
      ...u,
      post_utme_cutoff: parseFloat(u.post_utme_cutoff)
    }));

    res.status(200).json({
      course_id: parseInt(id),
      filter: type || 'all',
      count: universities.length,
      universities
    });

  } catch (error) {
    console.error('getUniversitiesByCourse error:', error.message);
    res.status(500).json({ message: 'Something went wrong' });
  }
};