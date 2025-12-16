import express from "express";
import cors from "cors";
import morgan from "morgan";
import { env } from "./lib/env.js";
import { notFound, errorHandler } from "./middlewares/errors.js";

import authRoutes from "./routes/auth.routes.js";
import meRoutes from "./routes/me.routes.js";
import roomsRoutes from "./routes/rooms.routes.js";
import interventionsRoutes from "./routes/interventions.routes.js";
import behaviorRoutes from "./routes/behavior.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import studentsRoutes from "./routes/students.routes.js";

const app = express(); // ✅ MUST COME FIRST

const allowed = env.CORS_ORIGINS.length
  ? env.CORS_ORIGINS
  : ["http://localhost:5173","http://localhost:5174","http://localhost:5175"];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    return cb(null, allowed.includes(origin));
  },
  credentials: true
}));

app.use(express.json());
app.use(morgan("dev"));

app.get("/", (_req, res) => res.json({ ok: true, name: "Dormitory API" }));
app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/me", meRoutes);
app.use("/api/rooms", roomsRoutes);
app.use("/api/interventions", interventionsRoutes);
app.use("/api/behavior", behaviorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/students", studentsRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});
