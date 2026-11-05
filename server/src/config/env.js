const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT must be a valid TCP port.");
const jwtSecret = process.env.JWT_SECRET || "";
const databaseUrl = process.env.DATABASE_URL || "";
const adminEmail = process.env.ADMIN_EMAIL || "";

export const config = { port, nodeEnv: process.env.NODE_ENV || "development", clientOrigin: process.env.CLIENT_ORIGIN || "*", jwtSecret, jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h", databaseUrl, adminEmail };

export function requireAuthConfiguration() {
  if (!config.jwtSecret) throw new Error("JWT_SECRET must be configured before authentication can be enabled.");
  if (!config.databaseUrl) throw new Error("DATABASE_URL must be configured before authentication can be enabled.");
}