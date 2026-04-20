import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createChatApp } from "../src/app.js";

test("health retourne service ok", async () => {
  const { app } = createChatApp();
  const response = await request(app).get("/health");
  assert.equal(response.status, 200);
  assert.equal(response.body.service, "chat-service");
});

test("creation de session publie un evenement", async () => {
  const events = [];
  const { app } = createChatApp({
    publishEvent: async (event) => {
      events.push(event);
    },
    idGenerator: () => "chat-test-1",
    now: () => "2026-01-01T10:00:00.000Z"
  });

  const response = await request(app).post("/api/chat/sessions").send({ clientName: "Client Test" });
  assert.equal(response.status, 201);
  assert.equal(response.body.item.id, "chat-test-1");
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "session_opened");
});

test("envoi message sur session inconnue retourne 404", async () => {
  const { app } = createChatApp();
  const response = await request(app).post("/api/chat/sessions/unknown/messages").send({
    senderRole: "client",
    senderName: "Client",
    content: "Bonjour"
  });
  assert.equal(response.status, 404);
  assert.equal(response.body.message, "Session introuvable");
});

test("envoi message sur session existante est persiste", async () => {
  const { app } = createChatApp({ idGenerator: () => "chat-test-2" });

  await request(app).post("/api/chat/sessions").send({ clientName: "Client Test" });
  const sendResponse = await request(app).post("/api/chat/sessions/chat-test-2/messages").send({
    senderRole: "client",
    senderName: "Client",
    content: "Bonjour"
  });
  assert.equal(sendResponse.status, 201);

  const listResponse = await request(app).get("/api/chat/sessions/chat-test-2/messages");
  assert.equal(listResponse.status, 200);
  assert.equal(listResponse.body.items.length, 1);
  assert.equal(listResponse.body.items[0].content, "Bonjour");
});
