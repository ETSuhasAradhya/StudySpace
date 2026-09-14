import express from 'express';
import { query } from '../db.js';
import { authenticateToken, requireAdmin } from '../authMiddleware.js';

const router = express.Router({ mergeParams: true });

// GET / - List seats for space with availability calculation
router.get('/', async (req, res) => {
  try {
    const spaceId = req.params.spaceId || req.query.spaceId;
    const { date, start_time, end_time } = req.query;

    if (date && start_time && end_time) {
      const sql = `
        SELECT 
          s.id,
          s.space_id,
          s.seat_number,
          s.has_power_outlet,
          s.is_corner_seat,
          s.created_at,
          CASE 
            WHEN r.id IS NOT NULL THEN true 
            ELSE false 
          END AS is_reserved,
          r.id AS reservation_id,
          r.user_id AS reserved_by_user_id,
          r.status AS reservation_status,
          u.name AS reserved_by_name,
          u.email AS reserved_by_email,
          r.start_time AS reserved_start_time,
          r.end_time AS reserved_end_time
        FROM seats s
        LEFT JOIN reservations r ON s.id = r.seat_id 
          AND r.reservation_date = $2
          AND r.status IN ('confirmed', 'verified')
          AND (r.start_time < $4::time AND r.end_time > $3::time)
        LEFT JOIN users u ON r.user_id = u.id
        WHERE s.space_id = $1
        ORDER BY s.id ASC
      `;
      const result = await query(sql, [spaceId, date, start_time, end_time]);
      return res.json(result.rows);
    }

    const result = await query(
      'SELECT id, space_id, seat_number, has_power_outlet, is_corner_seat, created_at FROM seats WHERE space_id = $1 ORDER BY id ASC',
      [spaceId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching seats:', error);
    res.status(500).json({ error: 'Failed to fetch seats.' });
  }
});

// POST / - Add seat (Admin)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const spaceId = req.params.spaceId || req.body.space_id;
    const { seat_number, has_power_outlet } = req.body;

    if (!seat_number) {
      return res.status(400).json({ error: 'Seat number is required (e.g. A1).' });
    }

    const result = await query(
      `INSERT INTO seats (space_id, seat_number, has_power_outlet)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [spaceId, seat_number.toUpperCase().trim(), has_power_outlet !== false]
    );

    res.status(201).json({
      message: 'Seat created successfully.',
      seat: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: `Seat "${req.body.seat_number}" already exists in this space.` });
    }
    console.error('Error creating seat:', error);
    res.status(500).json({ error: 'Failed to create seat.' });
  }
});

// PUT /:id or PUT /seats/:id - Update seat (Admin)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { seat_number, has_power_outlet } = req.body;

    const result = await query(
      `UPDATE seats
       SET seat_number = COALESCE($1, seat_number),
           has_power_outlet = COALESCE($2, has_power_outlet)
       WHERE id = $3
       RETURNING *`,
      [seat_number ? seat_number.toUpperCase().trim() : null, has_power_outlet, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Seat not found.' });
    }

    res.json({ message: 'Seat updated successfully.', seat: result.rows[0] });
  } catch (error) {
    console.error('Error updating seat:', error);
    res.status(500).json({ error: 'Failed to update seat.' });
  }
});

// DELETE /:id or DELETE /seats/:id - Delete seat (Admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM seats WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Seat not found.' });
    }

    res.json({ message: 'Seat deleted successfully.', id });
  } catch (error) {
    console.error('Error deleting seat:', error);
    res.status(500).json({ error: 'Failed to delete seat.' });
  }
});

export default router;
