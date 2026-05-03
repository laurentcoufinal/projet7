import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";

function parseAllowedOrigins(raw) {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function authMiddleware(jwtSecret) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token manquant" });
    }
    try {
      const token = authHeader.slice("Bearer ".length);
      req.user = jwt.verify(token, jwtSecret);
      return next();
    } catch {
      return res.status(401).json({ message: "Token invalide" });
    }
  };
}

export function createChatApp({
  jwtSecret,
  allowedOrigins = ["http://localhost:8081", "http://localhost:4200"],
  publishEvent = async () => {},
  now = () => new Date().toISOString(),
  idGenerator = () => `chat-${Date.now()}`
} = {}) {
  if (!jwtSecret) {
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

  const sessions = new Map();
  const requireAuth = authMiddleware(jwtSecret);

  function toSessionListEntry(session) {
    return {
      id: session.id,
      clientName: session.clientName,
      status: session.status,
      createdAt: session.createdAt,
      lastMessage: session.messages.at(-1) ?? null
    };
  }

  function appendMessage(sessionId, payload) {
    const session = sessions.get(sessionId);
    if (!session) {
      return null;
    }

    const message = {
      id: `${sessionId}-${Date.now()}`,
      sessionId,
      senderRole: payload.senderRole,
      senderName: payload.senderName,
      content: payload.content,
      sentAt: now()
    };

    session.messages.push(message);
    session.updatedAt = message.sentAt;
    return message;
  }

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "chat-service" });
  });

  app.get("/api/chat/sessions", requireAuth, (req, res) => {
    if (req.user.role !== "agent") {
      return res.status(403).json({ message: "Acces reserve aux agents" });
    }
    const items = Array.from(sessions.values()).map(toSessionListEntry);
    res.json({ items });
  });

  app.get("/api/chat/sessions/:sessionId/messages", requireAuth, (req, res) => {
    const session = sessions.get(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session introuvable" });
    }
    if (req.user.role === "agent") {
      return res.json({ items: session.messages });
    }
    if (req.user.role === "client" && session.ownerSub === req.user.sub) {
      return res.json({ items: session.messages });
    }
    return res.status(403).json({ message: "Acces refuse a cette session" });
  });

  app.post("/api/chat/sessions", requireAuth, async (req, res) => {
    if (req.user.role !== "client") {
      return res.status(403).json({ message: "Seuls les clients peuvent ouvrir une session" });
    }
    const { clientName } = req.body ?? {};
    if (!clientName) {
      return res.status(400).json({ message: "Le nom client est requis" });
    }

    const id = idGenerator();
    const current = now();
    const session = {
      id,
      clientName,
      ownerSub: req.user.sub,
      status: "open",
      createdAt: current,
      updatedAt: current,
      messages: []
    };

    sessions.set(id, session);

    await publishEvent({
      type: "session_opened",
      payload: toSessionListEntry(session)
    });

    return res.status(201).json({ item: toSessionListEntry(session) });
  });

  app.post("/api/chat/sessions/:sessionId/messages", requireAuth, async (req, res) => {
    const { content } = req.body ?? {};
    if (!content || typeof content !== "string") {
      return res.status(400).json({ message: "Message incomplet" });
    }

    const session = sessions.get(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session introuvable" });
    }

    if (req.user.role === "client") {
      if (session.ownerSub !== req.user.sub) {
        return res.status(403).json({ message: "Acces refuse a cette session" });
      }
    } else if (req.user.role !== "agent") {
      return res.status(403).json({ message: "Role non autorise" });
    }

    const message = appendMessage(req.params.sessionId, {
      senderRole: req.user.role,
      senderName: req.user.fullName,
      content
    });
    if (!message) {
      return res.status(404).json({ message: "Session introuvable" });
    }

    await publishEvent({ type: "message_posted", payload: message });
    return res.status(201).json({ item: message });
  });

  function getSession(sessionId) {
    return sessions.get(sessionId) ?? null;
  }

  return { app, sessions, getSession };
}
