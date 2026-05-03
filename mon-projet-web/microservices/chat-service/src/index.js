import Redis from "ioredis";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { createChatApp } from "./app.js";

const port = process.env.PORT || 3003;
const redisUrl = process.env.REDIS_URL || "redis://redis:6379";
const jwtSecret = process.env.JWT_SECRET || "dev-secret-change-me";
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:8081,http://localhost:4200")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const redisPublisher = new Redis(redisUrl);
const redisSubscriber = new Redis(redisUrl);
const redisChannel = "chat-events";

function publishEvent(event) {
  return redisPublisher.publish(redisChannel, JSON.stringify(event));
}

const { app, getSession } = createChatApp({ jwtSecret, allowedOrigins, publishEvent });

const server = app.listen(port, () => {
  console.log(`chat-service started on port ${port}`);
});

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("unauthorized"));
    }
    socket.user = jwt.verify(token, jwtSecret);
    return next();
  } catch {
    return next(new Error("unauthorized"));
  }
});

io.on("connection", (socket) => {
  if (socket.user.role === "agent") {
    socket.join("agents");
  }

  socket.on("join-session", (sessionId) => {
    const session = getSession(sessionId);
    if (!session) {
      return;
    }
    if (socket.user.role === "agent") {
      socket.join(sessionId);
      return;
    }
    if (socket.user.role === "client" && session.ownerSub === socket.user.sub) {
      socket.join(sessionId);
    }
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
    io.to("agents").emit("chat-session-opened", event.payload);
  }
});
