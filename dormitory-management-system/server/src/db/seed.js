import { pool } from "./pool.js";
import bcrypt from "bcryptjs";

async function main() {
  // Clean in FK order
  await pool.query("DELETE FROM behavior_records");
  await pool.query("DELETE FROM interventions");
  await pool.query("UPDATE users SET room_id=NULL, requested_room_id=NULL");
  await pool.query("DELETE FROM users");
  await pool.query("DELETE FROM rooms");
  await pool.query("DELETE FROM dormitory");

  await pool.query("INSERT INTO dormitory (num_total_rooms, num_available_rooms) VALUES (100, 100)");

  const rooms = [];
  for (let i = 1; i <= 10; i++) rooms.push([2, "available", "A", String(100+i)]);
  await pool.query("INSERT INTO rooms (capacity, status, building, room_number) VALUES ?", [rooms]);

  const hash = await bcrypt.hash("pass1234", 10);
  const users = [
    ["student1", hash, "student", "Student One", "student1@example.com", "0000000000"],
    ["reception1", hash, "receptionist", "Reception One", "reception1@example.com", "0000000000"],
    ["service1", hash, "service", "Service One", "service1@example.com", "0000000000"],
    ["admin1", hash, "admin", "Admin One", "admin1@example.com", "0000000000"],
  ];
  await pool.query(
    "INSERT INTO users (username, password_hash, role, name, email, phone) VALUES ?",
    [users]
  );

  console.log("Seeded: rooms + users (password: pass1234).");
  await pool.end();
}

main().catch((e)=>{ console.error(e); process.exit(1); });
