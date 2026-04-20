import cors from "cors";
import express from "express";
import Redis from "ioredis";
import { Server } from "socket.io";

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3003;
const redisUrl = process.env.REDIS_URL || "redis://redis:6379";
const redisPublisher = new Redis(redisUrl);
const redisSubscriber = new Redis(redisUrl);
const redisChannel = "chat-events";

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

function publishEvent(event) {
  return redisPublisher.publish(redisChannel, JSON.stringify(event));
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
    sentAt: new Date().toISOString()
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

  const id = `chat-${Date.now()}`;
  const now = new Date().toISOString();

  const session = {
    id,
    clientName,
    status: "open",
    createdAt: now,
    updatedAt: now,
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

const server = app.listen(port, () => {
  console.log(`chat-service started on port ${port}`);
});

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

io.on("connection", (socket) => {
  socket.on("join-session", (sessionId) => {
    socket.join(sessionId);
  });
});

redisSubscriber.subscribe(redisChannel, (error) => {
  if (error) {
    console.error("failed to subscribe to redis channel", error);
  }
});

redisSubscriber.on("message", (_channel, message) => {
  const event = JSON.parse(message);
  if (event.type === "message_posted") {
    io.to(event.payload.sessionId).emit("chat-message", event.payload);
  }
  if (event.type === "session_opened") {
    io.emit("chat-session-opened", event.payload);
  }
});
