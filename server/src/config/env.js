const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT must be a valid TCP port.");
const jwtSecret = process.env.JWT_SECRET || "";
export const config = { port, nodeEnv: process.env.NODE_ENV || "development", clientOrigin: process.env.CLIENT_ORIGIN || "*", jwtSecret, jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h" };
export function requireAuthConfiguration() { if (!config.jwtSecret) throw new Error("JWT_SECRET must be configured before authentication can be enabled."); }