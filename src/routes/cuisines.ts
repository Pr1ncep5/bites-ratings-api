import { Hono } from "hono";
import { initializeRedisClient } from "../utils/client";
import { cuisineKey, cuisinesKey, restaurantKeyById } from "../utils/keys";
import { createSuccessResponse } from "../utils/responses";
import type { AuthType } from "../lib/auth";

const router = new Hono<{ Variables: AuthType }>();

router.get("/", async (c) => {
  const client = await initializeRedisClient();
  const cuisines = await client.sMembers(cuisinesKey);

  const responseBody = createSuccessResponse(cuisines);
  return c.json(responseBody, 200);
});

router.get("/:cuisine", async (c) => {
  const cuisine = c.req.param("cuisine");
  const client = await initializeRedisClient();

  const restaurantIds = await client.sMembers(cuisineKey(cuisine));
  const restaurants = await Promise.all(
    restaurantIds.map((id) => client.hGet(restaurantKeyById(id), "name")),
  );

  const responseBody = createSuccessResponse(restaurants);
  return c.json(responseBody, 200);
});

export default router;
