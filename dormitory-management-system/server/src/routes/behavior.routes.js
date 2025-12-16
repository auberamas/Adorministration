import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { pool } from "../db/pool.js";

const router = Router();

// Receptionist records behavior: points entered = points to REMOVE (ex: 3)
// We store it as NEGATIVE in DB (ex: -3)
router.post("/", requireAuth, requireRole("receptionist"), async (req, res, next) => {
  try {
    const { studentId, description, points } = req.body || {};
    const sid = Number(studentId);
    const p = Number(points);

    if (!sid || !description || Number.isNaN(p)) {
      return res.status(400).json({ error: "studentId, description, points required" });
    }
    if (p <= 0) {
      return res.status(400).json({ error: "points must be > 0 (points to remove)" });
    }

    const deduction = -Math.abs(p); // always negative

    await pool.query(
      "INSERT INTO behavior_records (student_id, recorded_by, description, points) VALUES (:sid,:rid,:desc,:pts)",
      { sid, rid: req.user.sub, desc: description, pts: deduction }
    );

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
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
        GREATEST(0, LEAST(20, 20 + IFNULL(SUM(br.points),0))) AS score
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
