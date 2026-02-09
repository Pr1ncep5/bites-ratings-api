import { Hono } from "hono";
import { requireRole } from "../middlewares/authMiddleware";
import { createSuccessResponse } from "../utils/responses";
import type { AuthType } from "../lib/auth";
import { user } from "../db/schema";
import { eq } from "drizzle-orm";
import { db } from "../db";

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
  const allUsers = await db.select().from(user);
  return c.json(createSuccessResponse(allUsers, "All registered users retrieved, in total: " + allUsers.length));
});

export default router;
