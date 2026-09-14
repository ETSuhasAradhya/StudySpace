import express from 'express';
import { query, pool } from '../db.js';
import { authenticateToken, requireAdmin } from '../authMiddleware.js';

const router = express.Router();

// POST / - Create reservation with overlap detection
router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { seat_id, reservation_date, start_time, end_time } = req.body;
    const user_id = req.user.id;

    if (!seat_id || !reservation_date || !start_time || !end_time) {
      return res.status(400).json({ error: 'seat_id, reservation_date, start_time, and end_time are all required.' });
    }

    if (start_time >= end_time) {
      return res.status(400).json({ error: 'Start time must be strictly before end time.' });
    }

    const seatCheck = await client.query('SELECT id, space_id, seat_number FROM seats WHERE id = $1', [seat_id]);
    if (seatCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Seat not found.' });
    }

    await client.query('BEGIN');

    const overlapQuery = `
      SELECT id, start_time, end_time 
      FROM reservations
      WHERE seat_id = $1
        AND reservation_date = $2
        AND status = 'confirmed'
        AND (start_time < $4::time AND end_time > $3::time)
      FOR UPDATE
    `;
    const conflict = await client.query(overlapQuery, [seat_id, reservation_date, start_time, end_time]);

    if (conflict.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: 'Double-booking rejected: Seat is already reserved during this time slot.',
        conflict: {
          existing_start: conflict.rows[0].start_time,
          existing_end: conflict.rows[0].end_time
        }
      });
    }

    const insertQuery = `
      INSERT INTO reservations (user_id, seat_id, reservation_date, start_time, end_time, status)
      VALUES ($1, $2, $3, $4, $5, 'confirmed')
      RETURNING *
    `;
    const result = await client.query(insertQuery, [user_id, seat_id, reservation_date, start_time, end_time]);
    await client.query('COMMIT');

    const detailed = await query(`
      SELECT 
        r.id, r.user_id, r.seat_id, r.reservation_date, r.start_time, r.end_time, r.status, r.created_at,
        s.seat_number, sp.id AS space_id, sp.name AS space_name, sp.location
      FROM reservations r
      JOIN seats s ON r.seat_id = s.id
      JOIN study_spaces sp ON s.space_id = sp.id
      WHERE r.id = $1
    `, [result.rows[0].id]);

    res.status(201).json({
      message: 'Reservation confirmed successfully!',
      reservation: detailed.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Reservation creation error:', error);
    res.status(500).json({ error: 'Failed to create reservation.' });
  } finally {
    client.release();
  }
});

// GET /my - Current user's reservations
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        r.id, r.reservation_date, r.start_time, r.end_time, r.status, r.created_at,
        s.id AS seat_id, s.seat_number, s.has_power_outlet,
        sp.id AS space_id, sp.name AS space_name, sp.location
      FROM reservations r
      JOIN seats s ON r.seat_id = s.id
      JOIN study_spaces sp ON s.space_id = sp.id
      WHERE r.user_id = $1
      ORDER BY r.reservation_date DESC, r.start_time DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching my reservations:', error);
    res.status(500).json({ error: 'Failed to fetch your reservations.' });
  }
});

// GET / - All reservations (Admin)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        r.id, r.reservation_date, r.start_time, r.end_time, r.status, r.created_at,
        u.id AS user_id, u.name AS user_name, u.email AS user_email,
        s.seat_number, sp.name AS space_name, sp.location
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      JOIN seats s ON r.seat_id = s.id
      JOIN study_spaces sp ON s.space_id = sp.id
      ORDER BY r.reservation_date DESC, r.start_time DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all reservations:', error);
    res.status(500).json({ error: 'Failed to fetch all reservations.' });
  }
});

// PUT /:id/cancel - Cancel reservation
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT * FROM reservations WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }

    const reservation = existing.rows[0];

    if (reservation.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to cancel this reservation.' });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({ error: 'Reservation is already cancelled.' });
    }

    const updated = await query(
      `UPDATE reservations
       SET status = 'cancelled'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    res.json({
      message: 'Reservation cancelled successfully.',
      reservation: updated.rows[0]
    });
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    res.status(500).json({ error: 'Failed to cancel reservation.' });
  }
});

export default router;
