import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

// Needed in ES modules to get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const {
  DB_HOST = "localhost",
  DB_PORT = "3306",
  DB_USER = "root",
  DB_PASSWORD = "au27ra94SQL",
} = process.env;

async function main() {
  // Connect WITHOUT selecting a database
  // (because the SQL script does DROP / CREATE / USE)
  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  });

  try {
    const sqlPath = path.join(__dirname, "init.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    console.log("Initializing database from:", sqlPath);

    await connection.query(sql);

    console.log("Database initialized successfully.");
  } catch (err) {
    console.error("SQL execution error:", err.message);
    throw err;
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error("DB init failed:", err.message);
  process.exit(1);
});
