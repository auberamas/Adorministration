// The administrator has an overview of the dormitory and can manage: room requests and behavior requests

import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { pool } from "../db/pool.js";

// If score <= 0, the student is expelled in the users table
async function updateExpelledFlag(studentId) {
  // Get score
  const [rows] = await pool.query(
    `
    SELECT (20 + IFNULL(SUM(points),0)) AS raw_score
    FROM behavior_records
    WHERE student_id = ?
    `,
    [studentId]
  );

  const rawScore = Number(rows[0]?.raw_score ?? 20);

  // expelled = 1 if score <= 0, else expelled = 0
  const expelled = rawScore <= 0 ? 1 : 0;

  await pool.query(
    "UPDATE users SET expelled=? WHERE id=? AND role='student'",
    [expelled, studentId]
  );
}

const router = Router();

// All routes in this file require the user to be authenticated and have role "admin"
router.use(requireAuth, requireRole("admin"));

/**
 * ROOMS OVERVIEW
 * Shows:
 * - each room (available/occupied)
 * - which student occupies it (if any)
 * - behavior score (0..20)
 *
 */
router.get("/rooms-overview", async (_req, res, next) => {
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
        GREATEST(0, LEAST(20, 20 + COALESCE(SUM(br.points), 0))) AS behavior_score
      FROM rooms r
      LEFT JOIN users u ON u.room_id = r.id
      LEFT JOIN behavior_records br ON br.student_id = u.id
      GROUP BY r.id, u.id
      ORDER BY r.id
    `);

    res.json(rows);
  } catch (e) {
    next(e);
  }
});

/**
 * ROOM REQUESTS (PENDING)
 * List students who requested a room and are waiting for admin decision.
 */
router.get("/room-requests", async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`
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
    `);

    res.json(rows);
  } catch (e) {
    next(e);
  }
});

/**
 * ROOM REQUEST DECISION
 * - reject  => clear requested_room_id
 * - approve => assign room_id, clear request, set room occupied, paid=0 + notify student to pay
 */
router.post("/room-requests/:userId/decide", async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const userId = Number(req.params.userId);
    const { decision } = req.body || {};

    if (!["approve", "reject"].includes(decision)) {
      return res.status(400).json({ error: "decision must be approve|reject" });
    }

    await conn.beginTransaction();

    // Lock the student row
    const [urows] = await conn.query(
      "SELECT id, requested_room_id, room_id FROM users WHERE id=? AND role='student' FOR UPDATE",
      [userId]
    );

    const user = urows[0];
    const requested = user?.requested_room_id;

    if (!requested) {
      await conn.rollback();
      return res.status(400).json({ error: "No pending request" });
    }

    // Reject case
    if (decision === "reject") {
      await conn.query("UPDATE users SET requested_room_id=NULL WHERE id=?", [userId]);
      await conn.commit();
      return res.json({ ok: true });
    }

    // Approve case: occupy room ONLY if still available
    const [roomUpdate] = await conn.query(
      "UPDATE rooms SET status='occupied' WHERE id=? AND status='available'",
      [requested]
    );

    // If affectedRows === 0, someone already took it
    if (roomUpdate.affectedRows === 0) {
      await conn.rollback();
      return res.status(409).json({ error: "Room already taken" });
    }

    // Assign room to this student
    await conn.query(
      "UPDATE users SET room_id=?, requested_room_id=NULL, paid=0 WHERE id=?",
      [requested, userId]
    );

    // Optional but recommended: clear ALL other requests for the same room
    await conn.query(
      "UPDATE users SET requested_room_id=NULL WHERE requested_room_id=?",
      [requested]
    );

    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    next(e);
  } finally {
    conn.release();
  }
});

/**
 * STUDENTS LIST (ADMIN)
 * Lists all students and their payment/room assignment status.
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

/**
 * BEHAVIOR REQUESTS (PENDING)
 * Admin approves or rejects "behavior_requests" created by the reception
 */
router.get("/behavior-requests", async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        brq.id,
        brq.student_id,
        stu.name AS student_name,
        stu.username AS student_username,
        brq.points,
        brq.description,
        brq.created_at,
        brq.requested_by,
        req.name AS requested_by_name
      FROM behavior_requests brq
      JOIN users stu ON stu.id = brq.student_id
      JOIN users req ON req.id = brq.requested_by
      WHERE brq.status = 'pending'
      ORDER BY brq.id DESC
    `);

    res.json(rows);
  } catch (e) {
    next(e);
  }
});

/**
 * BEHAVIOR REQUEST DECISION
 * decision: "approve" or "reject"
 *
 * - reject  => mark request rejected 
 * - approve => insert a NEGATIVE points record in behavior_records then mark request approved
 */
router.post("/behavior-requests/:id/decide", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { decision } = req.body || {};

    if (!["approve", "reject"].includes(decision)) {
      return res.status(400).json({ error: "decision must be approve|reject" });
    }

    // Read the request (must be pending)
    const [rows] = await pool.query(
      "SELECT id, student_id, requested_by, description, points FROM behavior_requests WHERE id=? AND status='pending' LIMIT 1",
      [id]
    );

    const brq = rows[0];
    if (!brq) return res.status(404).json({ error: "Request not found or already decided" });

    if (decision === "reject") {
      await pool.query("UPDATE behavior_requests SET status='rejected' WHERE id=?", [id]);
      return res.json({ ok: true });
    }

    // Approve: apply deduction by inserting NEGATIVE points into behavior_records
    const deduction = -Math.abs(Number(brq.points));

    await pool.query(
      "INSERT INTO behavior_records (student_id, recorded_by, description, points) VALUES (?,?,?,?)",
      [brq.student_id, brq.requested_by, brq.description, deduction]
    );

    await pool.query("UPDATE behavior_requests SET status='approved' WHERE id=?", [id]);

    // Update expelled flag based on the new score
    await updateExpelledFlag(brq.student_id);


    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
