import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { prisma } from "../config/database.js";

const router = Router();
const allowedStatuses = new Set([
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
  "FAILED"
]);

function requireAdmin(req, res, next) {
  if (req.auth.role !== "ADMIN") {
    return res.status(403).json({ error: "Administrator access required." });
  }
  return next();
}

router.get("/requests", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const requests = await prisma.verificationRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 100),
      include: { user: { select: { name: true, email: true } } }
    });

    return res.json({
      requests: requests.map(item => ({
        id: item.id,
        reference: `VN-DEMO-${item.id.replace(/-/g, "").slice(-6).toUpperCase()}`,
        country: item.countryCode,
        service: item.service,
        status: item.status,
        createdAt: item.createdAt,
        user: item.user
      }))
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/requests/:id/status", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const status = String(req.body?.status || "").toUpperCase();
    if (!allowedStatuses.has(status)) {
      return res.status(400).json({ error: "Invalid request status." });
    }

    const request = await prisma.verificationRequest.update({
      where: { id: req.params.id },
      data: { status }
    });

    return res.json({ request: { id: request.id, status: request.status } });
  } catch (error) {
    return next(error);
  }
});

router.get("/summary", authenticate, requireAdmin, async (_req, res, next) => {
  try {
    const [users, requests, recent] = await Promise.all([
      prisma.user.count(),
      prisma.verificationRequest.count(),
      prisma.auditEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: { select: { name: true, email: true } } }
      })
    ]);

    return res.json({ users, requests, recent });
  } catch (error) {
    return next(error);
  }
});

export default router;
