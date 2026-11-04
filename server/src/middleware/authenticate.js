import jwt from "jsonwebtoken";
import { config, requireAuthConfiguration } from "../config/env.js";
export function authenticate(req, res, next) { try {
  requireAuthConfiguration(); const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) return res.status(401).json({ error: "Authentication required." });
  req.auth = jwt.verify(token, config.jwtSecret, { issuer: "verinest" }); next();
} catch { return res.status(401).json({ error: "Invalid or expired authentication token." }); } }