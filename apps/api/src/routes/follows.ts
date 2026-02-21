import { Hono } from "hono";
import { nanoid } from "nanoid";
import { eq, and, desc, count } from "drizzle-orm";
import { db } from "../db";
import { restaurantFollows } from "../db/schema";
import { requireAuth } from "../middlewares/authMiddleware";
import { checkRestaurantExists } from "../middlewares/checkRestaurantId";
import { createSuccessResponse, createErrorResponse } from "../utils/responses";
import { initializeRedisClient } from "../utils/client";
import { restaurantKeyById } from "../utils/keys";
import type { AuthType } from "../lib/auth";

const router = new Hono<{ Variables: AuthType }>();

router.post(
  "/:restaurantId",
  requireAuth,
  checkRestaurantExists,
  async (c) => {
    const restaurantId = c.req.param("restaurantId");
    const user = c.get("user");

    const existing = await db
      .select()
      .from(restaurantFollows)
      .where(
        and(
          eq(restaurantFollows.userId, user!.id),
          eq(restaurantFollows.restaurantId, restaurantId),
        ),
      )
      .limit(1);

    if (existing.length > 0 && existing[0]) {
      return c.json(
        createSuccessResponse(
          { followId: existing[0].id, restaurantId },
          "Already following this restaurant",
        ),
        200,
      );
    }

    const followId = nanoid();
    await db.insert(restaurantFollows).values({
      id: followId,
      userId: user!.id,
      restaurantId,
      createdAt: Date.now().toString(),
    });

    return c.json(
      createSuccessResponse(
        { followId, restaurantId },
        "Now following this restaurant",
      ),
      201,
    );
  },
);

router.delete(
  "/:restaurantId",
  requireAuth,
  checkRestaurantExists,
  async (c) => {
    const restaurantId = c.req.param("restaurantId");
    const user = c.get("user");

    const result = await db
      .delete(restaurantFollows)
      .where(
        and(
          eq(restaurantFollows.userId, user!.id),
          eq(restaurantFollows.restaurantId, restaurantId),
        ),
      )
      .returning({ id: restaurantFollows.id });

    if (result.length === 0) {
      return c.json(
        createErrorResponse("You are not following this restaurant"),
        404,
      );
    }

    return c.json(
      createSuccessResponse(
        { restaurantId },
        "Unfollowed this restaurant",
      ),
      200,
    );
  },
);

router.get("/", requireAuth, async (c) => {
  const user = c.get("user");
  const { page = "1", limit = "10" } = c.req.query();

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const offset = (pageNum - 1) * limitNum;

  const follows = await db
    .select()
    .from(restaurantFollows)
    .where(eq(restaurantFollows.userId, user!.id))
    .orderBy(desc(restaurantFollows.createdAt))
    .limit(limitNum)
    .offset(offset);

  const countResult = await db
    .select({ total: count() })
    .from(restaurantFollows)
    .where(eq(restaurantFollows.userId, user!.id));

  const total = countResult[0]?.total ?? 0;

  const client = await initializeRedisClient();
  const followsWithDetails = await Promise.all(
    follows.map(async (follow) => {
      const restaurantData = await client.hGetAll(
        restaurantKeyById(follow.restaurantId),
      );
      return {
        followId: follow.id,
        restaurantId: follow.restaurantId,
        followedAt: follow.createdAt,
        restaurant: Object.keys(restaurantData).length > 0 ? restaurantData : null,
      };
    }),
  );

  return c.json(
    createSuccessResponse(
      {
        follows: followsWithDetails,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      `Retrieved ${follows.length} followed restaurants`,
    ),
    200,
  );
});

router.get(
  "/:restaurantId/count",
  checkRestaurantExists,
  async (c) => {
    const restaurantId = c.req.param("restaurantId");

    const countResult = await db
      .select({ total: count() })
      .from(restaurantFollows)
      .where(eq(restaurantFollows.restaurantId, restaurantId));

    const total = countResult[0]?.total ?? 0;

    return c.json(
      createSuccessResponse(
        { restaurantId, followerCount: total },
        "Follower count retrieved",
      ),
      200,
    );
  },
);

export default router;
