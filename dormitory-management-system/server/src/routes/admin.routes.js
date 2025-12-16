import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { pool } from "../db/pool.js";

const router = Router();

// Admin guard once for all admin routes
router.use(requireAuth, requireRole("admin"));

/**
 * ROOMS overview:
 * - show room occupied/available
 * - occupied by which student
 * - behavior score 0..20 (sum points clamped)
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


/**
 * Existing: list pending room requests
 */
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

/**
 * Decide request:
 * decision: "approve" | "reject"
 * - approve => assign room_id, clear request, set room occupied, send notification "pay"
 * - reject  => clear request, send notification "choose another"
 *
 * Requires DB table `notifications` (see schema change).
 */
router.post("/room-requests/:userId/decide", async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    const { decision } = req.body || {};

    if (!["approve", "reject"].includes(decision)) {
      return res.status(400).json({ error: "decision must be approve|reject" });
    }

    const [urows] = await pool.query(
      "SELECT id, requested_room_id FROM users WHERE id=? AND role='student'",
      [userId]
    );
    const requested = urows[0]?.requested_room_id;
    if (!requested) return res.status(400).json({ error: "No pending request" });

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

    // approve
    await pool.query(
      "UPDATE users SET room_id=?, requested_room_id=NULL, paid=0 WHERE id=?",
      [requested, userId]
    );
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

/**
 * Optional (useful): list students (for manual assignment if you add it later)
 */
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
