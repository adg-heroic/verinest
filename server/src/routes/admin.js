import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { prisma } from "../config/database.js";
const router = Router();
function requireAdmin(req,res,next){ if(req.auth.role!=="ADMIN") return res.status(403).json({error:"Administrator access required."}); next(); }
router.get("/summary",authenticate,requireAdmin,async(_req,res,next)=>{try{const[users,requests,recent]=await Promise.all([prisma.user.count(),prisma.verificationRequest.count(),prisma.auditEvent.findMany({orderBy:{createdAt:"desc"},take:20,include:{user:{select:{name:true,email:true}}}})]);res.json({users,requests,recent});}catch(error){next(error)}});
export default router;