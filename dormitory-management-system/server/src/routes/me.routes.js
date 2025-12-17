// Dislay the profile of the authentified user
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { pool } from "../db/pool.js";

const router = Router();

// Return user, room_number and requested_room_number
router.get("/", requireAuth, async (req, res, next) => {
  try {
        const [rows] = await pool.query(
      `
      SELECT
        u.id, u.username, u.role, u.name, u.email, u.phone,
        u.room_id, u.requested_room_id, u.paid, u.expelled,
        r1.room_number AS room_number,
        r1.building AS building,
        r2.room_number AS requested_room_number,
        r2.building AS requested_building,
        GREATEST(0, LEAST(20, 20 + IFNULL(SUM(br.points),0))) AS behavior_score
      FROM users u
      LEFT JOIN rooms r1 ON r1.id = u.room_id
      LEFT JOIN rooms r2 ON r2.id = u.requested_room_id
      LEFT JOIN behavior_records br ON br.student_id = u.id
      WHERE u.id=:id
      GROUP BY u.id
      `,
      { id: req.user.sub }
    );
    res.json(rows[0] || null);
  } catch (e) {
    next(e);
  }
});


// Student can update only email and phone
router.patch("/", requireAuth, async (req, res, next) => {
  try {
    let { email, phone } = req.body || {};

    // Email validation
    if (email !== undefined && email !== null) {
      email = String(email).trim();
      if (email.length > 120) return res.status(400).json({ error: "Email too long" });
      if (email !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
    }

    // Phone validation: digits only, exactly 11 digits
    let phoneDigits = null;
    if (phone !== undefined && phone !== null && String(phone).trim() !== "") {
      phoneDigits = String(phone).replace(/\D/g, "");
      if (phoneDigits.length != 11) {
        return res.status(400).json({ error: "Phone must contain exactly 11 digits" });
      }
    }

    await pool.query(
      "UPDATE users SET email=:email, phone=:phone WHERE id=:id",
      {
        id: req.user.sub,
        email: email === undefined ? null : (email === "" ? null : email),
        phone: phoneDigits,
      }
    );

    // Return updated profile
    const [rows] = await pool.query(
      `
      SELECT
        u.id, u.username, u.role, u.name, u.email, u.phone,
        u.room_id, u.requested_room_id, u.paid,
        r1.room_number AS room_number,
        r1.building AS building,
        r2.room_number AS requested_room_number,
        r2.building AS requested_building
      FROM users u
      LEFT JOIN rooms r1 ON r1.id = u.room_id
      LEFT JOIN rooms r2 ON r2.id = u.requested_room_id
      WHERE u.id=:id
      `,
      { id: req.user.sub }
    );

    res.json(rows[0] || null);
  } catch (e) {
    next(e);
  }
});

// Artificial payment: student confirms payment after admin approval
router.post("/pay", requireAuth, async (req, res, next) => {
  try {
    const [urows] = await pool.query(
      "SELECT room_id, paid FROM users WHERE id=:id",
      { id: req.user.sub }
    );
    const u = urows[0];

    if (!u?.room_id) return res.status(400).json({ error: "No room assigned" });
    if (u.paid) return res.json({ ok: true });

    await pool.query("UPDATE users SET paid=1 WHERE id=:id", { id: req.user.sub });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
