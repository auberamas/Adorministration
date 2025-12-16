import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { pool } from "../db/pool.js";

const router = Router();

// Create intervention
router.post("/", requireAuth, requireRole("student", "receptionist"), async (req, res, next) => {
  try {
    const { roomId, type, description } = req.body || {};
    if (!type || !description) {
      return res.status(400).json({ error: "type,description required" });
    }
    if (!["cleaning", "repair"].includes(type)) {
      return res.status(400).json({ error: "Invalid type" });
    }

    let finalRoomId = null;

    // Student: room is preset (take user's assigned room)
    if (req.user.role === "student") {
      const [urows] = await pool.query(
        "SELECT room_id, paid FROM users WHERE id=:id",
        { id: req.user.sub }
      );
      const u = urows[0];
      if (!u?.room_id) return res.status(400).json({ error: "No room assigned yet" });
      // optional: require payment before interventions
      // if (!u.paid) return res.status(400).json({ error: "Room not paid yet" });

      finalRoomId = u.room_id;
    } else {
      // Receptionist: must provide roomId
      const n = Number(roomId);
      if (!n) return res.status(400).json({ error: "roomId required" });
      finalRoomId = n;
    }

    await pool.query(
      "INSERT INTO interventions (created_by, room_id, type, description, status) VALUES (:uid,:rid,:type,:desc,'pending')",
      { uid: req.user.sub, rid: finalRoomId, type, desc: description }
    );

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// List interventions
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const isServiceOrAdmin = ["service", "admin"].includes(req.user.role);

    const [rows] = isServiceOrAdmin
      ? await pool.query("SELECT * FROM interventions ORDER BY id DESC")
      : await pool.query(
          "SELECT * FROM interventions WHERE created_by=:uid ORDER BY id DESC",
          { uid: req.user.sub }
        );

    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// Service updates status
router.post("/:id/status", requireAuth, requireRole("service"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body || {};
    if (!["accepted", "rejected", "completed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    await pool.query(
      "UPDATE interventions SET status=:status, handled_by=:hid, updated_at=NOW() WHERE id=:id",
      { status, hid: req.user.sub, id }
    );

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
