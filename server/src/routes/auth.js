import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config, requireAuthConfiguration } from "../config/env.js";
import { createUser, findUserByEmail } from "../repositories/users.js";

const router = Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const publicUser = user => ({ id: user.id, name: user.name, email: user.email, createdAt: user.createdAt });
const issueToken = user => jwt.sign({ sub: user.id, email: user.email, role: user.role || "USER" }, config.jwtSecret, { expiresIn: config.jwtExpiresIn, issuer: "verinest" });

router.post("/register", async (req, res, next) => {
  try {
    requireAuthConfiguration();
    const { name, email, password } = req.body || {};
    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 80) return res.status(400).json({ error: "A name between 2 and 80 characters is required." });
    if (typeof email !== "string" || !emailPattern.test(email)) return res.status(400).json({ error: "A valid email address is required." });
    if (typeof password !== "string" || password.length < 12 || password.length > 128) return res.status(400).json({ error: "Password must be between 12 and 128 characters." });
    if (await findUserByEmail(email)) return res.status(409).json({ error: "An account with that email already exists." });

    const user = await createUser({ name: name.trim(), email: email.trim(), passwordHash: await bcrypt.hash(password, 12) });
    return res.status(201).json({ user: publicUser(user), token: issueToken(user) });
  } catch (error) { next(error); }
});

const attempts = new Map();
function checkLoginRate(req, res, next) { const key=req.ip||"unknown", now=Date.now(); let entry=attempts.get(key)||{count:0,reset:now+600000}; if(now>entry.reset) entry={count:0,reset:now+600000}; if(entry.count>=10) return res.status(429).json({error:"Too many sign-in attempts. Please try again later."}); entry.count++; attempts.set(key,entry); next(); }

router.post("/login", checkLoginRate, async (req, res, next) => {
  try {
    requireAuthConfiguration();
    const { email, password } = req.body || {};
    if (typeof email !== "string" || typeof password !== "string") return res.status(400).json({ error: "Email and password are required." });
    const user = await findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: "Invalid email or password." });
    return res.json({ user: publicUser(user), token: issueToken(user) });
  } catch (error) { next(error); }
});

export default router;