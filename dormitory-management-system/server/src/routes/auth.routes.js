// Expose login endpoint that returns a JWT token and user info

import { Router } from "express";
import { login } from "../services/auth.service.js";

const router = Router();

// Validate credentials and generate a JWT token and return { token, user } to the frontend
router.post("/login", async (req, res, next) => {
  try {
    res.json(await login(req.body));
  } catch (e) { next(e); }
});

export default router;
