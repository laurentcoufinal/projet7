import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import { scryptSync, timingSafeEqual } from "node:crypto";

const users = [
  {
    id: "client-1",
    username: "client",
    salt: "auth-poc-client-salt-16",
    passwordHashHex:
      "66b026397d4568f1af1227ea1c95d1cc56b19818faf51c9a30d88a01f03195c0107345e3f08debfb44faa99eb20b86f1662fb57ed9909e2efe7fec65b8a92ff7",
    role: "client",
    fullName: "Client Demo"
  },
  {
    id: "agent-1",
    username: "agent",
    salt: "auth-poc-agent-salt-16!",
    passwordHashHex:
      "1dce70214ac9e762a14af63991a8ca336a2ab0636c2673ab251f1de43593172d6300d889c36d82eb12c5ef150f9d86e9b1ca19500e398d962500c1d1a759d679",
    role: "agent",
    fullName: "Conseiller Demo"
  }
];

function verifyPassword(plain, salt, hashHex) {
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(plain, Buffer.from(salt), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function parseAllowedOrigins(raw) {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function createAuthApp({ jwtSecret, allowedOrigins = ["http://localhost:8081", "http://localhost:4200"] } = {}) {
  if (!jwtSecret || typeof jwtSecret !== "string") {
    throw new Error("jwtSecret is required");
  }
  const origins = Array.isArray(allowedOrigins) ? allowedOrigins : parseAllowedOrigins(String(allowedOrigins));

  const app = express();
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || origins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      }
    })
  );
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "auth-service" });
  });

  app.post("/login", (req, res) => {
    const { username, password } = req.body ?? {};
    const user = users.find((entry) => entry.username === username);
    if (!user || !password || !verifyPassword(password, user.salt, user.passwordHashHex)) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role, username: user.username, fullName: user.fullName },
      jwtSecret,
      { expiresIn: "8h" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName
      }
    });
  });

  app.get("/profile", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token manquant" });
    }

    try {
      const token = authHeader.slice("Bearer ".length);
      const decoded = jwt.verify(token, jwtSecret);
      return res.json({
        id: decoded.sub,
        username: decoded.username,
        role: decoded.role,
        fullName: decoded.fullName
      });
    } catch {
      return res.status(401).json({ message: "Token invalide" });
    }
  });

  return app;
}
