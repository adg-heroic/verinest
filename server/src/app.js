import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/env.js";
import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import accountRouter from "./routes/account.js";
import requestsRouter from "./routes/requests.js";
import adminRouter from "./routes/admin.js";

const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json({ limit: "100kb" }));

app.get("/", (_req, res) => res.json({
  name: "VeriNest API",
  stage: "prototype",
  liveServices: false,
  message: "No live verification provider is connected."
}));

app.use("/api/v1/health", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/account", accountRouter);
app.use("/api/v1/requests", requestsRouter);
app.use("/api/v1/admin", adminRouter);

app.use((_req, res) => res.status(404).json({ error: "Route not found" }));
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error." });
});

export default app;