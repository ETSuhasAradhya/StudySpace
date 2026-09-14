import express from 'express';
import { query, pool } from '../db/index.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// POST /api/reservations - Create reservation with overlap detection
router.post('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { seat_id, reservation_date, start_time, end_time } = req.body;
    const user_id = req.user.id;

    if (!seat_id || !reservation_date || !start_time || !end_time) {
      return res.status(400).json({ error: 'seat_id, reservation_date, start_time, and end_time are all required.' });
    }

    // Ensure start_time is before end_time
    if (start_time >= end_time) {
      return res.status(400).json({ error: 'Start time must be strictly before end time.' });
    }

    // Verify seat exists
    const seatCheck = await client.query('SELECT id, space_id, seat_number FROM seats WHERE id = $1', [seat_id]);
    if (seatCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Seat not found.' });
    }

    // Begin transaction for concurrency-safe check
    await client.query('BEGIN');

    // Overlap condition:
    // Two intervals [A_start, A_end) and [B_start, B_end) collide if:
    // A_start < B_end AND A_end > B_start
    const overlapQuery = `
      SELECT id, start_time, end_time 
      FROM reservations
      WHERE seat_id = $1
        AND reservation_date = $2
        AND status IN ('confirmed', 'verified')
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

    // Insert new reservation
    const insertQuery = `
      INSERT INTO reservations (user_id, seat_id, reservation_date, start_time, end_time, status)
      VALUES ($1, $2, $3, $4, $5, 'confirmed')
      RETURNING *
    `;
    const result = await client.query(insertQuery, [user_id, seat_id, reservation_date, start_time, end_time]);
    await client.query('COMMIT');

    // Fetch full details (space name, seat number) for response
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

// GET /api/reservations/my - Current user's reservations
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

// GET /api/reservations - Admin view of all reservations
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

// PUT /api/reservations/:id/cancel - Cancel reservation
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check reservation ownership or admin role
    const existing = await query('SELECT * FROM reservations WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }

    const reservation = existing.rows[0];

    // Only owner or admin can cancel
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

// PUT /:id/verify - Toggle student attendance verification (Admin only)
router.put('/:id/verify', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT * FROM reservations WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }

    const currentStatus = existing.rows[0].status;
    if (currentStatus === 'cancelled') {
      return res.status(400).json({ error: 'Cannot verify a cancelled reservation.' });
    }

    // Toggle between verified and confirmed
    const newStatus = currentStatus === 'verified' ? 'confirmed' : 'verified';

    const updated = await query(
      `UPDATE reservations
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [newStatus, id]
    );

    res.json({
      message: newStatus === 'verified' ? 'Student desk registration verified and marked present!' : 'Verification reverted to confirmed.',
      reservation: updated.rows[0]
    });
  } catch (error) {
    console.error('Error verifying reservation:', error);
    res.status(500).json({ error: 'Failed to verify reservation.' });
  }
});

export default router;
