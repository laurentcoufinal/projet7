import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createChatApp } from "../src/app.js";

const jwtSecret = "unit-test-chat-secret";

function tokenFor(role) {
  const payload =
    role === "agent"
      ? { sub: "agent-1", role: "agent", username: "agent", fullName: "Agent Test" }
      : { sub: "client-1", role: "client", username: "client", fullName: "Client Test" };
  return jwt.sign(payload, jwtSecret, { expiresIn: "1h" });
}

test("health retourne service ok", async () => {
  const { app } = createChatApp({ jwtSecret });
  const response = await request(app).get("/health");
  assert.equal(response.status, 200);
  assert.equal(response.body.service, "chat-service");
});

test("creation de session sans token retourne 401", async () => {
  const { app } = createChatApp({ jwtSecret });
  const response = await request(app).post("/api/chat/sessions").send({ clientName: "Client Test" });
  assert.equal(response.status, 401);
});

test("creation de session client publie un evenement", async () => {
  const events = [];
  const { app } = createChatApp({
    jwtSecret,
    publishEvent: async (event) => {
      events.push(event);
    },
    idGenerator: () => "chat-test-1",
    now: () => "2026-01-01T10:00:00.000Z"
  });

  const response = await request(app)
    .post("/api/chat/sessions")
    .set("Authorization", `Bearer ${tokenFor("client")}`)
    .send({ clientName: "Client Test" });
  assert.equal(response.status, 201);
  assert.equal(response.body.item.id, "chat-test-1");
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "session_opened");
});

test("liste sessions refuse le client", async () => {
  const { app } = createChatApp({ jwtSecret });
  const response = await request(app).get("/api/chat/sessions").set("Authorization", `Bearer ${tokenFor("client")}`);
  assert.equal(response.status, 403);
});

test("envoi message sur session inconnue retourne 404", async () => {
  const { app } = createChatApp({ jwtSecret });
  const response = await request(app)
    .post("/api/chat/sessions/unknown/messages")
    .set("Authorization", `Bearer ${tokenFor("client")}`)
    .send({ content: "Bonjour" });
  assert.equal(response.status, 404);
});

test("envoi message sur session existante utilise le nom du token", async () => {
  const { app } = createChatApp({ jwtSecret, idGenerator: () => "chat-test-2" });

  await request(app)
    .post("/api/chat/sessions")
    .set("Authorization", `Bearer ${tokenFor("client")}`)
    .send({ clientName: "Client Test" });

  const sendResponse = await request(app)
    .post("/api/chat/sessions/chat-test-2/messages")
    .set("Authorization", `Bearer ${tokenFor("client")}`)
    .send({ content: "Bonjour" });
  assert.equal(sendResponse.status, 201);
  assert.equal(sendResponse.body.item.senderName, "Client Test");
  assert.equal(sendResponse.body.item.senderRole, "client");

  const listResponse = await request(app)
    .get("/api/chat/sessions/chat-test-2/messages")
    .set("Authorization", `Bearer ${tokenFor("client")}`);
  assert.equal(listResponse.status, 200);
  assert.equal(listResponse.body.items.length, 1);
  assert.equal(listResponse.body.items[0].content, "Bonjour");
});

test("agent peut lire les messages d une session", async () => {
  const { app } = createChatApp({ jwtSecret, idGenerator: () => "chat-test-3" });

  await request(app)
    .post("/api/chat/sessions")
    .set("Authorization", `Bearer ${tokenFor("client")}`)
    .send({ clientName: "Client X" });

  await request(app)
    .post("/api/chat/sessions/chat-test-3/messages")
    .set("Authorization", `Bearer ${tokenFor("client")}`)
    .send({ content: "msg" });

  const listResponse = await request(app)
    .get("/api/chat/sessions/chat-test-3/messages")
    .set("Authorization", `Bearer ${tokenFor("agent")}`);
  assert.equal(listResponse.status, 200);
  assert.equal(listResponse.body.items.length, 1);
});
