import express from 'express';
import { query } from '../db/index.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/spaces - List all study spaces with seat count
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        s.id, 
        s.name, 
        s.location, 
        s.description, 
        s.capacity, 
        s.created_at,
        COUNT(st.id)::int AS total_seats
      FROM study_spaces s
      LEFT JOIN seats st ON s.id = st.space_id
      GROUP BY s.id
      ORDER BY s.id ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching study spaces:', error);
    res.status(500).json({ error: 'Failed to fetch study spaces.' });
  }
});

// GET /api/spaces/:id - Get single study space details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM study_spaces WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Study space not found.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching study space:', error);
    res.status(500).json({ error: 'Failed to fetch study space.' });
  }
});

// POST /api/spaces - Create new study space (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, location, description, capacity } = req.body;

    if (!name || !location) {
      return res.status(400).json({ error: 'Space name and location are required.' });
    }

    const result = await query(
      `INSERT INTO study_spaces (name, location, description, capacity)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name.trim(), location.trim(), description || '', capacity || 10]
    );

    res.status(201).json({
      message: 'Study space created successfully.',
      space: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating study space:', error);
    res.status(500).json({ error: 'Failed to create study space.' });
  }
});

// PUT /api/spaces/:id - Update study space (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, description, capacity } = req.body;

    const result = await query(
      `UPDATE study_spaces
       SET name = COALESCE($1, name),
           location = COALESCE($2, location),
           description = COALESCE($3, description),
           capacity = COALESCE($4, capacity)
       WHERE id = $5
       RETURNING *`,
      [name, location, description, capacity, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Study space not found.' });
    }

    res.json({
      message: 'Study space updated successfully.',
      space: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating study space:', error);
    res.status(500).json({ error: 'Failed to update study space.' });
  }
});

// DELETE /api/spaces/:id - Delete study space (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM study_spaces WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Study space not found.' });
    }

    res.json({ message: 'Study space deleted successfully.', id });
  } catch (error) {
    console.error('Error deleting study space:', error);
    res.status(500).json({ error: 'Failed to delete study space.' });
  }
});

export default router;
