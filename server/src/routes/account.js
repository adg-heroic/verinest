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

export default router;