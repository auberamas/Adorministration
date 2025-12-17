// Database initialization script
// Creates the database and its tables by executing init.sql.

import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Load environnemnt variables form .env
dotenv.config();

// Use ES module to get the current directory path and file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read Database connection settings
const {
  DB_HOST = "localhost",
  DB_PORT = "3306",
  DB_USER = "root",
  DB_PASSWORD = "",
} = process.env;

async function main() {
  // Create a connection without a database selected
  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  });

  try {
      // Load the SQL initialization script from src/db/init.sql
    const sqlPath = path.join(__dirname, "init.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    console.log("Initializing database from:", sqlPath);

    // Executes the full SQL script
    await connection.query(sql);

    console.log("Database initialized successfully.");
  } catch (err) {
    // Print SQL errors and rethrow so the process exits with failure
    console.error("SQL execution error:", err.message);
    throw err;
  } finally {
    // Always close the DB connection
    await connection.end();
  }
}

// Run the script and exit with code 1 on failure
main().catch((err) => {
  console.error("DB init failed:", err.message);
  process.exit(1);
});
