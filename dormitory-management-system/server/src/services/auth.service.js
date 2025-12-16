import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../lib/env.js";
import { pool } from "../db/pool.js";

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

export async function login(payload) {
  const { username, password } = LoginSchema.parse(payload);

  const [rows] = await pool.query(
    "SELECT id, username, password_hash, role, name FROM users WHERE username = :username LIMIT 1",
    { username }
  );
  const user = rows[0];
  if (!user) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role, username: user.username, name: user.name },
    env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  return { token, user: { id: user.id, username: user.username, role: user.role, name: user.name } };
}
