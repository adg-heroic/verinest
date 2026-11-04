import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/env.js";
import healthRouter from "./routes/health.js";

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json({ limit: "100kb" }));

app.get("/", (_req, res) => {
  res.json({
    name: "VeriNest API",
    stage: "prototype",
    liveServices: false,
    message: "No live verification provider is connected."
  });
});

app.use("/api/v1/health", healthRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

export default app;