import { Router } from "express";
import { config } from "../config/env.js";

const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "VeriNest API",
    environment: config.nodeEnv,
    stage: "prototype",
    liveServices: false,
    timestamp: new Date().toISOString()
  });
});

export default router;