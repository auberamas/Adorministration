// The administrator can has an overview of the dormitory and can manage room request

import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { pool } from "../db/pool.js";

const router = Router();

// Every routes in the file require the "admin" role
router.use(requireAuth, requireRole("admin"));

/**
 * ROOMS overview:
 * - show room occupied/available
 * - occupied by which student
 * - behavior score 0-20
 */
router.get("/rooms-overview", requireAuth, requireRole("admin"), async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        r.id AS room_id,
        r.building,
        r.room_number,
        r.status,
        u.id AS student_id,
        u.username AS student_username,
        u.name AS student_name,
        (20 - COALESCE(SUM(br.points), 0)) AS behavior_score
      FROM rooms r
      LEFT JOIN users u ON u.room_id = r.id
      LEFT JOIN behavior_records br ON br.student_id = u.id
      GROUP BY r.id, u.id
      ORDER BY r.id
    `);

    res.json(rows);
  } catch (e) { next(e); }
});


// List of pending room requests from students
router.get("/room-requests", async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        u.id AS user_id,
        u.username,
        u.name,
        u.requested_room_id,
        r.building,
        r.room_number,
        r.status AS requested_room_status
      FROM users u
      LEFT JOIN rooms r ON r.id = u.requested_room_id
      WHERE u.role='student' AND u.requested_room_id IS NOT NULL
      ORDER BY u.id DESC
      `
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// The admin choose if the student can get the requested room
router.post("/room-requests/:userId/decide", async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    const { decision } = req.body || {};

    if (!["approve", "reject"].includes(decision)) {
      return res.status(400).json({ error: "decision must be approve|reject" });
    }

    // Retrieve the student's pending room request
    const [urows] = await pool.query(
      "SELECT id, requested_room_id FROM users WHERE id=? AND role='student'",
      [userId]
    );
    const requested = urows[0]?.requested_room_id;
    
    // Ensure a pending request exists
    if (!requested) return res.status(400).json({ error: "No pending request" });
    
    // The admin reject the request
    if (decision === "reject") {
      await pool.query("UPDATE users SET requested_room_id=NULL WHERE id=?", [userId]);

      // notify student
      await pool.query(
        "INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)",
        [
          userId,
          "Room request refused",
          "Your room request has been refused. Please choose another available room and submit a new request.",
        ]
      );

      return res.json({ ok: true });
    }

    // The admin approve the request : assign the room
    await pool.query(
      "UPDATE users SET room_id=?, requested_room_id=NULL, paid=0 WHERE id=?",
      [requested, userId]
    );

    // Mark the room as occupied
    await pool.query("UPDATE rooms SET status='occupied' WHERE id=?", [requested]);

    // notify student to pay
    await pool.query(
      "INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)",
      [
        userId,
        "Room request accepted",
        "Your room request has been accepted. Please proceed to payment to confirm your accommodation.",
      ]
    );

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// List students that paid their room
router.get("/students", async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, username, name, room_id, requested_room_id, paid FROM users WHERE role='student' ORDER BY id DESC"
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

export default router;
