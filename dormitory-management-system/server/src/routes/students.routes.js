import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { pool } from "../db/pool.js";

const router = Router();

// Receptionist can list ONLY students who currently occupy a room
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
