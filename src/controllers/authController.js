import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const signToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/signup
export const signup = async (req, res) => {
  try {
    const { full_name, email, password, level } = req.body;

    if (!full_name || !email || !password || !level) {
      return res.status(400).json({ message: 'full_name, email, password, and level are required' });
    }

    if (!['JSS', 'SSS'].includes(level)) {
      return res.status(400).json({ message: 'level must be JSS or SSS' });
    }

    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, level)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, level, assessment_locked`,
      [full_name, email, password_hash, level]
    );

    const user = result.rows[0];
    const token = signToken(user);

    res.status(201).json({
      message: 'Account created',
      token,
      user
    });

  } catch (error) {
    console.error('signup error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        level: user.level,
        assessment_locked: user.assessment_locked
      }
    });

  } catch (error) {
    console.error('login error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/auth/me
// Protected by requireAuth. Lets the frontend check current status
// (including assessment_locked) at any time, using just the stored token,
// without needing to log in again or attempt a submit just to read the error.
export const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, level, assessment_locked,
              science_score, commercial_score, arts_score, recommended_track
       FROM users WHERE id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user: result.rows[0] });

  } catch (error) {
    console.error('getMe error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};