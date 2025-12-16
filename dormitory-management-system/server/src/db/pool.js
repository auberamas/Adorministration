// Provide a reusable pool of database connection for route/services

import mysql from "mysql2/promise";
import { env } from "../lib/env.js";

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,      // select the application database
  waitForConnections: true,   
  connectionLimit: 10,
  namedPlaceholders: true
});
