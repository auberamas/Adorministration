import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import { env } from "../lib/env.js";

const schemaPath = path.resolve("src/db/schema.sql");

async function main() {
  const sql = fs.readFileSync(schemaPath, "utf-8");
  const conn = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    multipleStatements: true
  });
  await conn.query(sql);
  await conn.end();
  console.log("DB schema applied.");
}

main().catch((e)=>{ console.error(e); process.exit(1); });
