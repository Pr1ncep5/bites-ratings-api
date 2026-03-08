import type { MiddlewareHandler } from "hono";
import { createErrorResponse } from "../utils/responses";
import { initializeRedisClient } from "../utils/client";
import { restaurantKeyById } from "../utils/keys";

export const checkRestaurantExists: MiddlewareHandler = async (c, next) => {
  const restaurantId = c.req.param("restaurantId");

  if (!restaurantId) {
    const errorBody = createErrorResponse("Restaurant ID not provided");
    return c.json(errorBody, 400);
  }

  const client = await initializeRedisClient();
  const restaurantKey = restaurantKeyById(restaurantId);

  const exists = await client.exists(restaurantKey);

  const restaurantStatus = await client.hGet(restaurantKey, "status");

  if (!exists || restaurantStatus === "deleted") {
    const errorBody = createErrorResponse("Restaurant not found");
    return c.json(errorBody, 404);
  }

  await next();
};
