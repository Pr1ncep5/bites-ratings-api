import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "../lib/auth";
import type { AuthType } from "../lib/auth";

const router = new Hono<{ Variables: AuthType }>({
  strict: false,
});

router.use(
  "*",
  cors({
    origin: "http://localhost:3000",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

router.on(["POST", "GET"], "/*", (c) => {
  return auth.handler(c.req.raw);
});

export default router;
