// Provide room lists
// All student to see the available rooms
import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { pool } from "../db/pool.js";

const router = Router();

// Return all rooms
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

// Return only rooms currently available
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

// Student submits a room request for a specific roomId
router.post("/request", requireAuth, requireRole("student"), async (req, res, next) => {
  try {
    // Extract and convert the requested room ID from the request body
    const roomId = Number(req.body?.roomId);

    // Validate that a roomId was provided
    if (!roomId) return res.status(400).json({ error: "roomId required" });

    // Retrieve the student's current room and create a pending room request
    const [urows] = await pool.query(
      "SELECT room_id, requested_room_id FROM users WHERE id=:id",
      { id: req.user.sub }
    );

    const u = urows[0];

    // If the user does not exist (should not normally happen)
    if (!u) return res.status(404).json({ error: "User not found" });

    // Prevent requesting a room if the student already has one assigned
    if (u.room_id) return res.status(400).json({ error: "You already have a room" });
    
    // Prevent multiple pending room requests
    if (u.requested_room_id) return res.status(400).json({ error: "You already have a pending request" });

    // Check that the requested room exists and is currently available
    const [rrows] = await pool.query("SELECT id, status FROM rooms WHERE id=:id", { id: roomId });
    if (!rrows[0] || rrows[0].status !== "available") {
      return res.status(400).json({ error: "Room not available" });
    }

    // Register the room request by storing it in requested_room_id
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
