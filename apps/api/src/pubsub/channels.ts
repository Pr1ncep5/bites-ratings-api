import type { RedisClientType } from "redis";

export const CHANNELS = {
  RESTAURANT_UPDATES: "restaurant_updates",
} as const;

export type RestaurantUpdateEvent =
  | { type: "NEW_REVIEW"; restaurantId: string; reviewId: string; rating: number }
  | { type: "REVIEW_UPDATED"; restaurantId: string; reviewId: string }
  | { type: "REVIEW_DELETED"; restaurantId: string; reviewId: string }
  | { type: "RESTAURANT_UPDATED"; restaurantId: string };

export async function publishRestaurantUpdate(
  client: RedisClientType,
  event: RestaurantUpdateEvent,
) {
  await client.publish(CHANNELS.RESTAURANT_UPDATES, JSON.stringify(event));
}
