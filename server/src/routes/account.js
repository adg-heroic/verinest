import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
const router = Router();
router.get("/me", authenticate, (req, res) => res.json({ user: { id: req.auth.sub, email: req.auth.email } }));
export default router;