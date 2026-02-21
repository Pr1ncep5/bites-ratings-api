import { Hono } from "hono";
import { eq, and, desc, count } from "drizzle-orm";
import { db } from "../db";
import { notifications } from "../db/schema";
import { requireAuth } from "../middlewares/authMiddleware";
import { createSuccessResponse, createErrorResponse } from "../utils/responses";
import { initializeRedisClient } from "../utils/client";
import { restaurantKeyById } from "../utils/keys";
import type { AuthType } from "../lib/auth";

const router = new Hono<{ Variables: AuthType }>();

router.get("/", requireAuth, async (c) => {
  const user = c.get("user");
  const { page = "1", limit = "20" } = c.req.query();

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  const userNotifications = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user!.id))
    .orderBy(desc(notifications.createdAt))
    .limit(limitNum)
    .offset(offset);

  const countResult = await db
    .select({ total: count() })
    .from(notifications)
    .where(eq(notifications.userId, user!.id));
  const total = countResult[0]?.total ?? 0;

  const client = await initializeRedisClient();
  const enrichedNotifications = await Promise.all(
    userNotifications.map(async (notification) => {
      const restaurantData = await client.hGetAll(
        restaurantKeyById(notification.restaurantId),
      );
      return {
        id: notification.id,
        type: notification.type,
        restaurantId: notification.restaurantId,
        restaurantName: restaurantData?.name || null,
        data: JSON.parse(notification.data),
        read: notification.read === true,
        createdAt: notification.createdAt,
      };
    }),
  );

  return c.json(
    createSuccessResponse(
      {
        notifications: enrichedNotifications,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      `Retrieved ${userNotifications.length} notifications`,
    ),
    200,
  );
});

router.get("/unread-count", requireAuth, async (c) => {
  const user = c.get("user");

  const countResult = await db
    .select({ total: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, user!.id),
        eq(notifications.read, false),
      ),
    );
  const total = countResult[0]?.total ?? 0;

  return c.json(
    createSuccessResponse(
      { unreadCount: total },
      "Unread count retrieved",
    ),
    200,
  );
});

router.patch("/:id/read", requireAuth, async (c) => {
  const user = c.get("user");
  const notificationId = c.req.param("id");

  const result = await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, user!.id),
      ),
    )
    .returning({ id: notifications.id });

  if (result.length === 0) {
    return c.json(
      createErrorResponse("Notification not found or not yours"),
      404,
    );
  }

  return c.json(
    createSuccessResponse(
      { notificationId },
      "Notification marked as read",
    ),
    200,
  );
});

router.patch("/read-all", requireAuth, async (c) => {
  const user = c.get("user");

  const result = await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(
        eq(notifications.userId, user!.id),
        eq(notifications.read, false),
      ),
    )
    .returning({ id: notifications.id });

  return c.json(
    createSuccessResponse(
      { markedAsRead: result.length },
      `Marked ${result.length} notifications as read`,
    ),
    200,
  );
});

export default router;
