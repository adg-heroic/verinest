import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { prisma } from "../config/database.js";

const router = Router();
const allowedCountries = new Set(["United States", "United Kingdom", "Canada", "Germany"]);
const allowedServices = new Set([
  "Sandbox / test workflow",
  "Authorized business verification",
  "Application testing"
]);

function toRequest(item) {
  return {
    id: item.id,
    reference: `VN-DEMO-${item.id.replace(/-/g, "").slice(-6).toUpperCase()}`,
    country: item.countryCode,
    service: item.service,
    status: item.status,
    createdAt: item.createdAt
  };
}

router.get("/", authenticate, async (req, res, next) => {
  try {
    const requests = await prisma.verificationRequest.findMany({
      where: { userId: req.auth.sub },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 100)
    });
    return res.json({ requests: requests.map(toRequest) });
  } catch (error) {
    next(error);
  }
});

router.post("/", authenticate, async (req, res, next) => {
  try {
    const { country, service } = req.body || {};
    if (!allowedCountries.has(country)) {
      return res.status(400).json({ error: "Please select a valid demo region." });
    }
    if (!allowedServices.has(service)) {
      return res.status(400).json({ error: "Please select a valid demo service category." });
    }

    const request = await prisma.verificationRequest.create({
      data: {
        userId: req.auth.sub,
        countryCode: country,
        service,
        status: "PENDING"
      }
    });

    return res.status(201).json({
      request: toRequest(request),
      message: "Demo request created. No live verification service was contacted."
    });
  } catch (error) {
    next(error);
  }
});

export default router;