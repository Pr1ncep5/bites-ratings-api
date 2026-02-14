import type { RedisClientType } from "redis";
import { eventsStreamKey } from "../utils/keys";

const DEFAULT_STREAM_MAX_LEN = 10000;

type BaseDomainEvent = {
  eventId: string;
  timestamp: number;
  actorUserId: string | null;
  entityId: string;
  entityType: "restaurant" | "review";
};

export type DomainEvent =
  | (BaseDomainEvent & {
    eventType: "REVIEW_CREATED";
    payload: {
      restaurantId: string;
      reviewId: string;
      rating: number;
    };
  })
  | (BaseDomainEvent & {
    eventType: "REVIEW_UPDATED";
    payload: {
      restaurantId: string;
      reviewId: string;
      oldRating: number;
      newRating: number;
    };
  })
  | (BaseDomainEvent & {
    eventType: "REVIEW_DELETED";
    payload: {
      restaurantId: string;
      reviewId: string;
    };
  })
  | (BaseDomainEvent & {
    eventType: "RESTAURANT_UPDATED";
    payload: {
      restaurantId: string;
      locationChanged: boolean;
      cuisinesAdded: string[];
      cuisinesRemoved: string[];
    };
  });

export async function appendDomainEvent(
  client: RedisClientType,
  event: DomainEvent,
  maxLen: number = DEFAULT_STREAM_MAX_LEN,
) {
  await client.xAdd(
    eventsStreamKey,
    "*",
    {
      eventId: event.eventId,
      eventType: event.eventType,
      timestamp: String(event.timestamp),
      actorUserId: event.actorUserId ?? "",
      entityId: event.entityId,
      entityType: event.entityType,
      payload: JSON.stringify(event.payload),
    },
    {
      TRIM: {
        strategy: "MAXLEN",
        strategyModifier: "~",
        threshold: maxLen,
      },
    },
  );
}
