import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

// Requires a reachable Postgres database (DATABASE_URL) with migrations applied.
// docker compose up -d postgres && npx prisma migrate deploy && npm test

const testEmail = `test.${Date.now()}@example.com`;
const testPassword = "SuperSecret123!";

describe("Auth flow", () => {
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  it("registers a new user and returns an access token", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: testEmail,
      password: testPassword,
      firstName: "Test",
      lastName: "User",
    });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTypeOf("string");
    expect(res.body.user.email).toBe(testEmail);
  });

  it("rejects registration with an invalid email", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "not-an-email",
      password: testPassword,
      firstName: "Test",
      lastName: "User",
    });

    expect(res.status).toBe(400);
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testEmail,
      password: testPassword,
    });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTypeOf("string");
  });

  it("rejects login with the wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testEmail,
      password: "wrong-password",
    });

    expect(res.status).toBe(401);
  });

  it("rejects access to a protected route without a token", async () => {
    const res = await request(app).get("/api/accounts");
    expect(res.status).toBe(401);
  });
});
