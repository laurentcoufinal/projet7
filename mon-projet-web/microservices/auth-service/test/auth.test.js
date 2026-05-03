import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createAuthApp } from "../src/app.js";

const app = createAuthApp({ jwtSecret: "unit-test-secret" });

test("health retourne service ok", async () => {
  const response = await request(app).get("/health");
  assert.equal(response.status, 200);
  assert.equal(response.body.service, "auth-service");
});

test("login valide retourne un token et un profil", async () => {
  const response = await request(app).post("/login").send({
    username: "client",
    password: "client123"
  });

  assert.equal(response.status, 200);
  assert.ok(response.body.token);
  assert.equal(response.body.user.role, "client");
});

test("login mot de passe incorrect retourne 401", async () => {
  const response = await request(app).post("/login").send({
    username: "client",
    password: "wrong-password"
  });
  assert.equal(response.status, 401);
});

test("profile refuse un token manquant", async () => {
  const response = await request(app).get("/profile");
  assert.equal(response.status, 401);
  assert.equal(response.body.message, "Token manquant");
});
