import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../config/database.js";
import { authenticate } from "../middleware/authenticate.js";
import { findUserById } from "../repositories/users.js";

const router = Router();
const publicUser = user => ({ id:user.id, name:user.name, email:user.email, role:user.role, emailVerified:Boolean(user.emailVerifiedAt), createdAt:user.createdAt });

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await findUserById(req.auth.sub);
    if (!user) return res.status(404).json({ error: "Account not found." });

    return res.json({
      user: publicUser(user),
      account: user.account ? { balance: user.account.balance.toString(), currency: user.account.currency } : null
    });
  } catch (error) { next(error); }
});

router.patch("/profile", authenticate, async (req, res, next) => {
  try {
    const name = String(req.body?.name || "").trim();
    if (name.length < 2 || name.length > 80) return res.status(400).json({ error: "Name must be between 2 and 80 characters." });
    const user = await prisma.user.update({ where: { id: req.auth.sub }, data: { name } });
    return res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
});

router.patch("/password", authenticate, async (req,res,next)=>{ try { const {currentPassword,newPassword}=req.body||{}; if(typeof currentPassword!=="string"||typeof newPassword!=="string") return res.status(400).json({error:"Current and new passwords are required."}); if(newPassword.length<12||newPassword.length>128) return res.status(400).json({error:"New password must be between 12 and 128 characters."}); if(currentPassword===newPassword) return res.status(400).json({error:"Your new password must be different from your current password."}); const user=await prisma.user.findUnique({where:{id:req.auth.sub}}); if(!user||!(await bcrypt.compare(currentPassword,user.passwordHash))) return res.status(401).json({error:"Current password is incorrect."}); await prisma.user.update({where:{id:user.id},data:{passwordHash:await bcrypt.hash(newPassword,12)}}); await prisma.auditEvent.create({data:{userId:user.id,action:"PASSWORD_CHANGED"}}); res.json({message:"Password updated successfully."}); } catch(e){next(e)} });
export default router;