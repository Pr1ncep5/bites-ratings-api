import type { MiddlewareHandler } from "hono";
import { auth } from "../lib/auth";
import { createErrorResponse } from "../utils/responses";

export const sessionMiddleware: MiddlewareHandler = async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  c.set("user", session?.user ?? null);
  c.set("session", session?.session ?? null);

  await next();
};

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    return c.json(createErrorResponse("Unauthorized - Please log in"), 401);
  }

  c.set("user", session.user);
  c.set("session", session.session);

  await next();
};

export const requireRole = (...roles: string[]): MiddlewareHandler => {
  return async (c, next) => {
    const user = c.get("user");

    if (!user) {
      return c.json(createErrorResponse("Unauthorized"), 401);
    }

    if (!roles.includes(user.role)) {
      return c.json(createErrorResponse("Forbidden - Insufficient permissions"), 403);
    }

    await next();
  };
};

export const requirePermission = (resource: string, action: string): MiddlewareHandler => {
  return async (c, next) => {
    const user = c.get("user");

    if (!user) {
      return c.json(createErrorResponse("Unauthorized"), 401);
    }

    const hasPermission = await auth.api.userHasPermission({
      body: {
        userId: user.id,
        permission: { [resource]: [action] },
      },
    });

    if (!hasPermission?.success) {
      return c.json(createErrorResponse("Forbidden - Insufficient permissions"), 403);
    }

    await next();
  };
};
