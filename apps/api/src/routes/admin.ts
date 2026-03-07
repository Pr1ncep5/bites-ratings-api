import { Hono } from "hono";
import { requireRole } from "../middlewares/authMiddleware";
import { createSuccessResponse } from "../utils/responses";
import type { AuthType } from "../lib/auth";
import { user } from "../db/schema";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { initializeRedisClient } from "../utils/client";
import { eventsStreamKey } from "../utils/keys";
import { AdminUserListItemSchema } from "@bites-ratings/shared";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const UpdateRoleSchema = z.object({
  role: z.enum(["admin", "owner", "user"]),
});

const UpdateBanSchema = z.object({
  banned: z.boolean(),
  banReason: z.string().optional().nullable(),
});

const router = new Hono<{ Variables: AuthType }>();

router.use("*", requireRole("admin"));

router.get("/audit-users", async (c) => {
  const admins = await db.select().from(user).where(eq(user.role, "admin"));
  return c.json(createSuccessResponse(admins, "Admin audit completed"));
});

router.get("/user-lookup", async (c) => {
  const email = c.req.query("email");

  if (!email) {
    return c.json({ error: "Email is a required parameter" }, 400);
  }

  const result = await db
    .select()
    .from(user)
    .where(eq(user.email, email));

  const foundUser = result[0];

  return c.json(createSuccessResponse(foundUser, "User with email " + email + " found"));
});

router.get("/users", async (c) => {
  const rawAllUsers = await db.select().from(user);

  const allValidatedUsers = rawAllUsers.map((user) => AdminUserListItemSchema.parse(user));

  return c.json(createSuccessResponse(allValidatedUsers, "All registered users retrieved, in total: " + allValidatedUsers.length));
});

router.get("/events", async (c) => {
  const client = await initializeRedisClient();
  const count = Number(c.req.query("count") ?? "50");

  const safeCount = Number.isFinite(count) && count > 0 ? Math.min(count, 200) : 50;

  const streamEntries = await client.xRevRange(eventsStreamKey, "+", "-", {
    COUNT: safeCount,
  });

  const events = streamEntries.map((entry) => {
    const fields = entry.message;
    return {
      streamId: entry.id,
      eventId: fields.eventId,
      eventType: fields.eventType,
      timestamp: new Date(Number(fields.timestamp)).toISOString(),
      actorUserId: fields.actorUserId || null,
      entityId: fields.entityId,
      entityType: fields.entityType,
      payload: fields.payload ? JSON.parse(fields.payload) : null,
    };
  });

  return c.json(
    createSuccessResponse(events, `Latest ${events.length} domain events retrieved`),
  );
});

router.patch(
  "/users/:id/role",
  zValidator("json", UpdateRoleSchema),
  async (c) => {
    const id = c.req.param("id");
    const { role } = c.req.valid("json");

    const result = await db
      .update(user)
      .set({ role, updatedAt: new Date().toISOString() })
      .where(eq(user.id, id))
      .returning();

    if (result.length === 0) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json(createSuccessResponse(null, `User role successfully updated to ${role}`));
  }
);

router.patch(
  "/users/:id/ban",
  zValidator("json", UpdateBanSchema),
  async (c) => {
    const id = c.req.param("id");
    const { banned, banReason } = c.req.valid("json");

    const result = await db
      .update(user)
      .set({
        banned,
        banReason: banned ? banReason : null,
        updatedAt: new Date().toISOString()
      })
      .where(eq(user.id, id))
      .returning();

    if (result.length === 0) {
      return c.json({ error: "User not found" }, 404);
    }

    const statusStr = banned ? "banned" : "unbanned";
    return c.json(createSuccessResponse(null, `User successfully ${statusStr}`));
  }
);

export default router;
