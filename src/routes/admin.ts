import { Hono } from "hono";
import { requireRole } from "../middlewares/authMiddleware";
import { runSqlFile } from "../db/manager";
import { createSuccessResponse } from "../utils/responses";
import type { AuthType } from "../lib/auth";

const router = new Hono<{ Variables: AuthType }>();

router.use("*", requireRole("admin"));

router.get("/audit-users", (c) => {
  const admins = runSqlFile("getAdminUsers.sql");
  return c.json(createSuccessResponse(admins, "Admin audit completed"));
});

router.get("/user-lookup", (c) => {
  const email = c.req.query("email");
  const user = runSqlFile("getUserByEmail.sql", { $email: email });
  return c.json(createSuccessResponse(user, "User lookup completed"));
});

export default router;
