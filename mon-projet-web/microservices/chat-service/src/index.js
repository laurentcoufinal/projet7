import Redis from "ioredis";
import { Server } from "socket.io";
import { createChatApp } from "./app.js";

const port = process.env.PORT || 3003;
const redisUrl = process.env.REDIS_URL || "redis://redis:6379";
const redisPublisher = new Redis(redisUrl);
const redisSubscriber = new Redis(redisUrl);
const redisChannel = "chat-events";

function publishEvent(event) {
  return redisPublisher.publish(redisChannel, JSON.stringify(event));
}

const { app } = createChatApp({ publishEvent });

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
