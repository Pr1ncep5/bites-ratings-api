import { eq, and, count } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../db";
import { notifications, restaurantFollows } from "../db/schema";
import { initializeRedisClient } from "../utils/client";
import { userNotificationsChannel } from "../utils/keys";

export type NotificationEvent = {
  type: "NEW_REVIEW" | "RESTAURANT_UPDATED";
  restaurantId: string;
  data: Record<string, unknown>;
};

export type NotificationResult = {
  notificationIds: string[];
  followerCount: number;
};

/**
 * Notifies all followers of a restaurant about an event.
 * Uses batch insert for efficiency - e.g. 5,000+ followers in one query.
 *
 * @param event - The event that triggered the notification
 * @returns Object with notification IDs and follower count
 */
export async function notifyFollowers(
  event: NotificationEvent,
): Promise<NotificationResult> {
  const followers = await db
    .select({ userId: restaurantFollows.userId })
    .from(restaurantFollows)
    .where(eq(restaurantFollows.restaurantId, event.restaurantId));

  if (followers.length === 0) {
    return { notificationIds: [], followerCount: 0 };
  }

  const now = Date.now().toString();
  const notificationIds: string[] = [];

  const notificationRows = followers.map((f) => {
    const id = nanoid();
    notificationIds.push(id);
    return {
      id,
      userId: f.userId,
      type: event.type,
      restaurantId: event.restaurantId,
      data: JSON.stringify(event.data),
      read: false,
      createdAt: now,
    };
  });

  // ONE batch insert - handles INSERT INTO notifications VALUES (...), (...), (...)
  await db.insert(notifications).values(notificationRows);

  console.log(
    `[Notifications] Created ${notificationIds.length} notifications for restaurant ${event.restaurantId}`,
  );

  // Publish to Redis Pub/Sub for real-time delivery to connected WebSocket clients
  // Each user gets their notification on their personal channel
  try {
    const redisClient = await initializeRedisClient();
    const publishPromises = followers.map((f, i) =>
      redisClient.publish(
        userNotificationsChannel(f.userId),
        JSON.stringify({
          id: notificationIds[i],
          type: event.type,
          restaurantId: event.restaurantId,
          data: event.data,
          createdAt: now,
        }),
      ),
    );
    await Promise.all(publishPromises);
    console.log(
      `[Notifications] Published ${publishPromises.length} Pub/Sub messages`,
    );
  } catch (error) {
    console.error("[Notifications] Failed to publish to Pub/Sub: in notifyFollowers", error);
  }

  return {
    notificationIds,
    followerCount: followers.length,
  };
}

export async function getUnreadCount(userId: string): Promise<number> {
  const result = await db
    .select({ total: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.read, false),
      ),
    );

  return result[0]?.total ?? 0;
}
