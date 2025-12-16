// Give the list of students that have a room
// Used by the recetion and the admin
import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { pool } from "../db/pool.js";

const router = Router();

// List only students who have an assigned room
router.get("/", requireAuth, requireRole("receptionist", "admin"), async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.id,
        u.name,
        u.username,
        r.building,
        r.room_number
      FROM users u
      JOIN rooms r ON r.id = u.room_id
      WHERE u.role = 'student'
      ORDER BY r.building, r.room_number, u.name
    `);
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

export default router;
