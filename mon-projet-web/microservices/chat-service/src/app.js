import cors from "cors";
import express from "express";

export function createChatApp({ publishEvent = async () => {}, now = () => new Date().toISOString(), idGenerator = () => `chat-${Date.now()}` } = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const sessions = new Map();

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

  app.get("/api/chat/sessions", (_req, res) => {
    const items = Array.from(sessions.values()).map(toSessionListEntry);
    res.json({ items });
  });

  app.get("/api/chat/sessions/:sessionId/messages", (req, res) => {
    const session = sessions.get(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session introuvable" });
    }
    return res.json({ items: session.messages });
  });

  app.post("/api/chat/sessions", async (req, res) => {
    const { clientName } = req.body ?? {};
    if (!clientName) {
      return res.status(400).json({ message: "Le nom client est requis" });
    }

    const id = idGenerator();
    const current = now();
    const session = {
      id,
      clientName,
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

  app.post("/api/chat/sessions/:sessionId/messages", async (req, res) => {
    const { senderRole, senderName, content } = req.body ?? {};
    if (!senderRole || !senderName || !content) {
      return res.status(400).json({ message: "Message incomplet" });
    }

    const message = appendMessage(req.params.sessionId, { senderRole, senderName, content });
    if (!message) {
      return res.status(404).json({ message: "Session introuvable" });
    }

    await publishEvent({ type: "message_posted", payload: message });
    return res.status(201).json({ item: message });
  });

  return { app, sessions };
}
