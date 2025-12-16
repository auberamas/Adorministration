import { Router } from "express";
import { login } from "../services/auth.service.js";

const router = Router();

router.post("/login", async (req, res, next) => {
  try {
    res.json(await login(req.body));
  } catch (e) { next(e); }
});

export default router;
