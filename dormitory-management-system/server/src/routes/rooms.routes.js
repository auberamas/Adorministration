import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { pool } from "../db/pool.js";

const router = Router();

router.get("/", requireAuth, async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, building, room_number, status FROM rooms ORDER BY id"
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.get("/available", requireAuth, async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, building, room_number, status FROM rooms WHERE status='available' ORDER BY id"
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.post("/request", requireAuth, requireRole("student"), async (req, res, next) => {
  try {
    const roomId = Number(req.body?.roomId);
    if (!roomId) return res.status(400).json({ error: "roomId required" });

    const [urows] = await pool.query(
      "SELECT room_id, requested_room_id FROM users WHERE id=:id",
      { id: req.user.sub }
    );
    const u = urows[0];
    if (!u) return res.status(404).json({ error: "User not found" });
    if (u.room_id) return res.status(400).json({ error: "You already have a room" });
    if (u.requested_room_id) return res.status(400).json({ error: "You already have a pending request" });

    const [rrows] = await pool.query("SELECT id, status FROM rooms WHERE id=:id", { id: roomId });
    if (!rrows[0] || rrows[0].status !== "available") {
      return res.status(400).json({ error: "Room not available" });
    }

    await pool.query(
      "UPDATE users SET requested_room_id=:roomId WHERE id=:userId",
      { roomId, userId: req.user.sub }
    );

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
