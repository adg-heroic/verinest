import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { findUserById } from "../repositories/users.js";

const router = Router();

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await findUserById(req.auth.sub);
    if (!user) return res.status(404).json({ error: "Account not found." });

    return res.json({
      user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
      account: user.account ? { balance: user.account.balance.toString(), currency: user.account.currency } : null
    });
  } catch (error) { next(error); }
});

router.patch("/profile", authenticate, async (req, res, next) => {
  try {
    const name = String(req.body?.name || "").trim();
    if (name.length < 2 || name.length > 80) return res.status(400).json({ error: "Name must be between 2 and 80 characters." });
    const user = await (await import("../config/database.js")).prisma.user.update({ where: { id: req.auth.sub }, data: { name } });
    return res.json({ user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt } });
  } catch (error) { next(error); }
});

export default router;