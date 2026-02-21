import { Hono } from "hono";
import { cors } from "hono/cors";
import { getConnInfo } from "hono/bun";
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
  // Before was this: return auth.handler(c.req.raw);
  const info = getConnInfo(c);
  const headers = new Headers(c.req.raw.headers);
  if (!headers.has("x-forwarded-for")) {
    headers.set("x-forwarded-for", info.remote.address || "127.0.0.1");
  }
  return auth.handler(new Request(c.req.raw, { headers }));
});

export default router;
