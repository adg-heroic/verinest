import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { prisma } from "../src/config/database.js";

const port = Number(process.env.PORT || 3001);
const baseUrl = `http://127.0.0.1:${port}`;
const email = `smoke-${Date.now()}-${Math.random().toString(36).slice(2)}@example.invalid`;
const password = "VerificationTestPassword123!";
let server;

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/v1/health`);
      if (response.ok) return;
    } catch {}
    await delay(500);
  }
  throw new Error("Server did not become ready in time.");
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json();
  if (!response.ok) throw new Error(`${path} failed: ${response.status} ${body.error || ""}`);
  return body;
}

try {
  server = spawn(process.execPath, ["src/server.js"], {
    cwd: new URL("..", import.meta.url),
    env: { ...process.env, PORT: String(port), NODE_ENV: "test" },
    stdio: "inherit"
  });

  await waitForServer();

  const registration = await request("/api/v1/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Verification Test", email, password })
  });

  if (!registration.token || registration.user.email !== email) {
    throw new Error("Registration response did not contain the expected user and token.");
  }

  const login = await request("/api/v1/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const account = await request("/api/v1/account/me", {
    headers: { authorization: `Bearer ${login.token}` }
  });

  if (account.user.email !== email || account.account?.currency !== "USD" || account.account?.balance !== "0") {
    throw new Error("Persistent account data did not match expectations.");
  }

  console.log("Stage 4 verification passed: registration, login, protected account, and database persistence all responded successfully.");
} finally {
  if (server && !server.killed) server.kill("SIGTERM");
  await prisma.user.delete({ where: { email } }).catch(() => {});
  await prisma.$disconnect();
}