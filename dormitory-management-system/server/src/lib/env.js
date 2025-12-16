import dotenv from "dotenv";
dotenv.config();

function required(name, fallback=null) {
  const v = process.env[name] ?? fallback;
  if (v === null || v === undefined || v === "") {
    throw new Error(`Missing env var: ${name}`);
  }
  return v;
}

export const env = {
  PORT: Number(process.env.PORT || 4000),
  DB_HOST: required("DB_HOST", "localhost"),
  DB_PORT: Number(process.env.DB_PORT || 3306),
  DB_USER: required("DB_USER", "root"),
  DB_PASSWORD: process.env.DB_PASSWORD || "",
  DB_NAME: required("DB_NAME", "dormitory_db"),
  JWT_SECRET: required("JWT_SECRET", "change_me_in_production"),
  CORS_ORIGINS: (process.env.CORS_ORIGINS || "").split(",").map(s=>s.trim()).filter(Boolean)
};
