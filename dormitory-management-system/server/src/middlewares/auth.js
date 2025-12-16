// Imports to check the token and its signature
import jwt from "jsonwebtoken";
import { env } from "../lib/env.js";

// Check that the request has been made by an authenticated user
export function requireAuth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;

  // If no token is provided, deny access
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    // Verify the token signature and expiration
    // If it is valid, store the decoded payload in req.user
    req.user = jwt.verify(token, env.JWT_SECRET);
    return next();
  } catch {
    // If the token is invalid or expired the access is denied
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Middleware that restricts access based on user roles
export function requireRole(...roles) {
  return (req, res, next) => {
    // Ensure the user is authenticated
    if (!req.user) return res.status(401).json({ error: "Missing token" });
    
    // Check if the user's role is authorized
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}
