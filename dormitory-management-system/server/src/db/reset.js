import mysql from "mysql2/promise";
import { env } from "../lib/env.js";

async function main() {
  const conn = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    multipleStatements: true
  });
  await conn.query(`DROP DATABASE IF EXISTS \`${env.DB_NAME}\`;`);
  await conn.end();
  console.log(`Dropped database ${env.DB_NAME}.`);
}

main().catch((e)=>{ console.error(e); process.exit(1); });
