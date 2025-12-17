// Receptionist can record behavior incidents and ask interventions
import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { pool } from "../db/pool.js";

const router = Router();

// Record behavior
router.post("/", requireAuth, requireRole("receptionist"), async (req, res, next) => {
  try {
    const { studentId, description, points } = req.body || {};
    const sid = Number(studentId);
    const p = Number(points);

    if (!sid || !description || Number.isNaN(p)) {
      return res.status(400).json({ error: "studentId, description, points required" });
    }
    if (p <= 0) {
      return res.status(400).json({ error: "points must be > 0" });
    }

    await pool.query(
      `INSERT INTO behavior_requests (student_id, requested_by, description, points, status)
       VALUES (:sid, :rid, :desc, :pts, 'pending')`,
      { sid, rid: req.user.sub, desc: description.trim(), pts: Math.abs(p) }
    );

    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Admin report: score is between 0 and 20
// Since points are NEGATIVE, final score = 20 + SUM(points)
router.get("/report", requireAuth, requireRole("admin"), async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        br.student_id,
        COUNT(*) AS incidents,
        IFNULL(SUM(br.points),0) AS total_delta,
        GREATEST(0, LEAST(20, 20 - IFNULL(SUM(br.points),0))) AS score
      FROM behavior_records br
      GROUP BY br.student_id
      ORDER BY score DESC
    `);
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

export default router;
