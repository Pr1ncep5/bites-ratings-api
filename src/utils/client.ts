import { createClient, type RedisClientType } from "redis";

let client: RedisClientType | null = null;
let subscriber: RedisClientType | null = null;

export async function initializeRedisClient() {
  if (!client) {
    client = createClient();

    client.on("error", (error) => {
      console.error("Redis Error:", error);
    });

    client.on("connect", () => {
      console.log("Redis connected");
    });

    await client.connect();
  }
  return client;
}

export async function initializeSubscriberClient() {
  if (!subscriber) {
    subscriber = createClient();

    subscriber.on("error", (error) => {
      console.error("Redis Subscriber Error:", error);
    });

    subscriber.on("connect", () => {
      console.log("Redis Subscriber connected");
    });

    await subscriber.connect();
  }
  return subscriber;
}

export const redisClient = initializeRedisClient();
