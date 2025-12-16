import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../lib/env.js";
import { pool } from "../db/pool.js";

// Define what is a valid login request
const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

// Validate the playload, create a token, then send data to frontende 
export async function login(payload) {
  const { username, password } = LoginSchema.parse(payload);

  // Retrieve the user from the database by username
  const [rows] = await pool.query(
    "SELECT id, username, password_hash, role, name FROM users WHERE username = :username LIMIT 1",
    { username }
  );

  // If the user does not exist, return an authentication error (401)
  const user = rows[0];
  if (!user) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  // Compare the provided password with the stored hashed password using bcrypt
  const ok = await bcrypt.compare(password, user.password_hash);
  // If the password is incorrect, return an authentication error (401)
  if (!ok) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  // Generate a JWT token containing the user identity and role
  const token = jwt.sign(
    { sub: user.id, role: user.role, username: user.username, name: user.name },
    env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  // Return the token and user information to the frontend
  return { token, user: { id: user.id, username: user.username, role: user.role, name: user.name } };
}
