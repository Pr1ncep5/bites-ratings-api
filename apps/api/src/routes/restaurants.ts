import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  RestaurantCreateSchema,
  RestaurantDetailsSchema,
  RestaurantResponseSchema,
  ReviewCreateSchema,
  ReviewResponseSchema,
  type RestaurantCreate,
  type RestaurantDetails,
  type ReviewCreate,
  type RestaurantListItem,
  type RawRedisDocument,
  type PaginatedRestaurants,
  parseRedisRestaurant,
} from "@bites-ratings/shared";
import { initializeRedisClient } from "../utils/client";
import { nanoid } from "nanoid";
import {
  cuisineKey,
  cuisinesKey,
  restaurantCuisinesKeyById,
  restaurantDetailsKeyById,
  restaurantKeyById,
  restaurantsBloomKey,
  restaurantsByRatingKey,
  restaurantsIndexKey,
  reviewDetailsKeyById,
  reviewKeyById,
  weatherKeyById,
} from "../utils/keys";
import { createErrorResponse, createSuccessResponse } from "../utils/responses";
import { checkRestaurantExists } from "../middlewares/checkRestaurantId";
import { checkReviewExists } from "../middlewares/checkReviewId";
import { requireAuth, requireRole } from "../middlewares/authMiddleware";
import { publishRestaurantUpdate } from "../pubsub/channels";
import { appendDomainEvent } from "../streams/events";
import { notifyFollowers } from "../notifications/service";
import type { AuthType } from "../lib/auth";
import { escapeRedisTag, escapeRedisText } from "../utils/redis";

const router = new Hono<{ Variables: AuthType }>();

router.get("/", async (c) => {
  const client = await initializeRedisClient();
  const { page = "1", limit = "10", cuisine } = c.req.query();

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const start = (pageNum - 1) * limitNum;

  let restaurantIds: string[];
  let hasMore: boolean;

  if (cuisine) {
    const cuisineIds = await client.sMembers(cuisineKey(cuisine.toLowerCase()));
    const scores = await Promise.all(
      cuisineIds.map((id) => client.zScore(restaurantsByRatingKey, id)),
    );
    const sorted = cuisineIds
      .map((id, i) => ({ id, score: scores[i] ?? 0 }))
      .sort((a, b) => b.score - a.score);
    restaurantIds = sorted.slice(start, start + limitNum).map((s) => s.id);
    hasMore = sorted.length > start + limitNum;
  } else {
    const total = await client.zCard(restaurantsByRatingKey);
    restaurantIds = await client.zRange(restaurantsByRatingKey, start, start + limitNum - 1, {
      REV: true,
    });
    hasMore = total > start + limitNum;
  }

  const pipeline = client.multi();

  restaurantIds.forEach((id) => {
    pipeline.hGetAll(restaurantKeyById(id));
    pipeline.sMembers(restaurantCuisinesKeyById(id));
  });

  const results = await pipeline.exec();

  const restaurants = [];
  for (let i = 0; i < restaurantIds.length; i++) {
    const rawData = results[i * 2] as unknown as Record<string, string>;
    const cuisines = results[i * 2 + 1] as unknown as string[];

    const validatedRestaurant = RestaurantResponseSchema.parse({
      ...rawData,
      cuisines,
    });

    restaurants.push(validatedRestaurant);
  }

  const responseBody = createSuccessResponse({ restaurants, hasMore, page: pageNum });
  return c.json(responseBody, 200);
});

router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  zValidator("json", RestaurantCreateSchema),
  async (c) => {
    const validatedData: RestaurantCreate = c.req.valid("json");
    const client = await initializeRedisClient();
    const user = c.get("user");

    if (!user) {
      return c.json(createErrorResponse("User was not found while creating restaurant"), 404);
    }

    const id = nanoid();
    const restaurantKey = restaurantKeyById(id);

    const normalizedName = validatedData.name.trim();
    const normalizedLocation = validatedData.location.trim();
    
    const bloomString = `${normalizedName.toLowerCase()}:${normalizedLocation.toLowerCase()}`;
    const hasSeenBefore = await client.bf.exists(restaurantsBloomKey, bloomString);

    if (hasSeenBefore) {
      return c.json(
        createErrorResponse(
          "This restaurant already exists (or was previously deleted at this location)",
        ),
        409,
      );
    }

    const normalizedCuisines = validatedData.cuisines.map((c) => c.toLowerCase());

    const hashData = {
      id: id,
      name: normalizedName,
      location: normalizedLocation,
      ownerId: user.id,
      avgStars: "0",
      totalStars: "0",
      viewCount: "0",
      status: "active",
    };

    await Promise.all([
      ...normalizedCuisines.map((cuisine) =>
        Promise.all([
          client.sAdd(cuisinesKey, cuisine),
          client.sAdd(cuisineKey(cuisine), id),
          client.sAdd(restaurantCuisinesKeyById(id), cuisine),
        ]),
      ),
      client.hSet(restaurantKey, hashData),
      client.zAdd(restaurantsByRatingKey, {
        score: 0,
        value: id,
      }),
      client.bf.add(restaurantsBloomKey, bloomString),
    ]);

    const responseBody = createSuccessResponse(
      { id, key: restaurantKey },
      "New restaurant created and saved",
    );

    return c.json(responseBody, 201);
  },
);

router.get("/search", async (c) => {
  const { q } = c.req.query();
  const client = await initializeRedisClient();

  const rawResults = await client.ft.search(restaurantsIndexKey, `@name:${q}* @status:{active}`);

  if (rawResults.total === 0) {
    return c.json(createSuccessResponse([]), 200);
  }

  const pipeline = client.multi();
  rawResults.documents.forEach((doc) => {
    const id = doc.value.id as string;
    pipeline.sMembers(restaurantCuisinesKeyById(id));
  });

  const cuisineResults = await pipeline.exec();

  const formattedResults = rawResults.documents.map((doc, index) => {
    const cuisines = cuisineResults[index] as unknown as string[];

    return RestaurantResponseSchema.parse({
      ...doc.value,
      cuisines,
    });
  });

  const responseBody = createSuccessResponse(formattedResults);
  return c.json(responseBody, 200);
});

router.get("/:restaurantId", checkRestaurantExists, async (c) => {
  const restaurantId = c.req.param("restaurantId");
  const client = await initializeRedisClient();

  const restaurantKey = restaurantKeyById(restaurantId);

  const [viewCount, restaurantRawData, cuisines] = await Promise.all([
    client.hIncrBy(restaurantKey, "viewCount", 1),
    client.hGetAll(restaurantKey),
    client.sMembers(restaurantCuisinesKeyById(restaurantId)),
  ]);

  const validatedData = RestaurantResponseSchema.parse({
    ...restaurantRawData,
    viewCount,
    cuisines,
  });

  const responseBody = createSuccessResponse(validatedData);
  return c.json(responseBody, 200);
});

router.post(
  "/:restaurantId/details",
  requireAuth,
  checkRestaurantExists,
  zValidator("json", RestaurantDetailsSchema),
  async (c) => {
    const restaurantId = c.req.param("restaurantId");
    const validatedData: RestaurantDetails = c.req.valid("json");
    const client = await initializeRedisClient();

    const restaurantDetailsKey = restaurantDetailsKeyById(restaurantId);
    await client.json.set(restaurantDetailsKey, ".", validatedData);

    const responseBody = createSuccessResponse(validatedData, "Restaurant details added");
    return c.json(responseBody, 201);
  },
);

router.get("/:restaurantId/details", checkRestaurantExists, async (c) => {
  const restaurantId = c.req.param("restaurantId");
  const client = await initializeRedisClient();

  const restaurantDetailsKey = restaurantDetailsKeyById(restaurantId);
  const details = await client.json.get(restaurantDetailsKey);

  const responseBody = createSuccessResponse(details, "Restaurant details fetched");
  return c.json(responseBody, 201);
});

router.get("/:restaurantId/weather", checkRestaurantExists, async (c) => {
  const restaurantId = c.req.param("restaurantId");

  const client = await initializeRedisClient();
  const restaurantKey = restaurantKeyById(restaurantId);
  const weatherKey = weatherKeyById(restaurantId);

  const cachedWeather = await client.get(weatherKey);
  if (cachedWeather) {
    console.log("Cache Hit: Weather data served from Redis");
    return c.json(createSuccessResponse(JSON.parse(cachedWeather)), 200);
  }

  const [longitude, latitude] = await Promise.all([
    client.hGet(restaurantKey, "longitude"),
    client.hGet(restaurantKey, "latitude"),
  ]);
  
  if (!longitude || !latitude) {
    const responseBody = createErrorResponse("Coordinates haven't been found");
    return c.json(responseBody, 404);
  }

  const apiResponse = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${process.env.WEATHER_API_KEY}`,
  );

  if (apiResponse.status === 200) {
    const weatherJson = await apiResponse.json();
    await client.set(weatherKey, JSON.stringify(weatherJson), {
      EX: 60 * 60,
    });
    console.log("Cache Miss: Fetched data and saved to Redis");
    return c.json(createSuccessResponse(weatherJson), 200);
  }

  return c.json(createErrorResponse("Could not fetch weather info"), 503);
});

router.post(
  "/:restaurantId/reviews",
  requireAuth,
  checkRestaurantExists,
  zValidator("json", ReviewCreateSchema),
  async (c) => {
    const restaurantId = c.req.param("restaurantId");
    const data: ReviewCreate = c.req.valid("json");
    const client = await initializeRedisClient();
    const user = c.get("user");

    const reviewId = nanoid();
    const reviewKey = reviewKeyById(restaurantId);
    const reviewDetailsKey = reviewDetailsKeyById(reviewId);
    const restaurantKey = restaurantKeyById(restaurantId);

    const reviewData = {
      id: reviewId,
      review: data.review,
      rating: data.rating,
      timestamp: Date.now(),
      restaurantId,
      authorId: user!.id,
    };

    const [reviewCount, setResult, totalStarsString] = await Promise.all([
      client.lPush(reviewKey, reviewId),
      client.hSet(reviewDetailsKey, reviewData),
      client.hIncrByFloat(restaurantKey, "totalStars", data.rating),
    ]);

    const numericTotalStars = parseFloat(totalStarsString);
    const averageRating = Number((numericTotalStars / reviewCount).toFixed(1));

    await Promise.all([
      client.zAdd(restaurantsByRatingKey, {
        score: averageRating,
        value: restaurantId,
      }),
      client.hSet(restaurantKey, "avgStars", averageRating),
    ]);

    await publishRestaurantUpdate(client, {
      type: "NEW_REVIEW",
      restaurantId,
      reviewId,
      rating: data.rating,
    });

    try {
      await appendDomainEvent(client, {
        eventId: nanoid(),
        eventType: "REVIEW_CREATED",
        timestamp: Date.now(),
        actorUserId: user?.id ?? null,
        entityId: reviewId,
        entityType: "review",
        payload: {
          restaurantId,
          reviewId,
          rating: data.rating,
        },
      });
    } catch (error) {
      console.error("Failed to append stream event REVIEW_CREATED:", error);
    }

    notifyFollowers({
      type: "NEW_REVIEW",
      restaurantId,
      data: {
        reviewId,
        rating: data.rating,
        reviewerName: user?.name ?? "Anonymous",
      },
    }).catch((err) => console.error("Failed to notify followers:", err));

    const responseBody = createSuccessResponse(reviewData, "Review added");
    return c.json(responseBody, 201);
  },
);

router.get("/:restaurantId/reviews", checkRestaurantExists, async (c) => {
  const restaurantId = c.req.param("restaurantId");
  const client = await initializeRedisClient();
  const reviewKey = reviewKeyById(restaurantId);

  const { page = "1", limit = "10" } = c.req.query();
  const pageNum = Number(page);
  const limitNum = Number(limit);

  const start = (pageNum - 1) * limitNum;
  const end = start + limitNum - 1;

  const totalReviews = await client.lLen(reviewKey);
  const hasMoreReviews = totalReviews > start + limitNum;

  const reviewIds = await client.lRange(reviewKey, start, end);
  const reviews = await Promise.all(
    reviewIds.map((id) => client.hGetAll(reviewDetailsKeyById(id))),
  );

  const validatedReviews = reviews.map((raw) => ReviewResponseSchema.parse(raw));

  const responseBody = createSuccessResponse(
    {
      reviews: validatedReviews,
      hasMore: hasMoreReviews,
      page: pageNum,
    },
    "Reviews fetched",
  );

  return c.json(responseBody, 200);
});

router.put(
  "/:restaurantId",
  requireAuth,
  checkRestaurantExists,
  zValidator("json", RestaurantCreateSchema),
  async (c) => {
    const restaurantId = c.req.param("restaurantId");
    const restaurantKey = restaurantKeyById(restaurantId);
    const user = c.get("user");

    const client = await initializeRedisClient();
    const newData: RestaurantCreate = c.req.valid("json");

    const existingData = await client.hGetAll(restaurantKey);

    if (user!.role !== "admin") {
      if (!existingData.ownerId || existingData.ownerId !== user!.id) {
        return c.json(
          createErrorResponse("Forbidden - You can only update your own restaurants"),
          403,
        );
      }
    }

    const oldData = existingData;
    const normalizedAddress = newData.address.trim();
    const latitude = newData.latitude;
    const longitude = newData.longitude;
    const geo = `${longitude},${latitude}`;
    const normalizedCuisines = newData.cuisines.map((c) => c.toLowerCase());

    const updatedHashData = {
      ...oldData,
      name: newData.name.trim(),
      address: normalizedAddress,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      geo,
      cuisineTags: normalizedCuisines.join(","),
    };

    const hasCoordinatesChanged = oldData.latitude !== latitude.toString() || oldData.longitude !== longitude.toString();

    const restaurantCuisinesKey = restaurantCuisinesKeyById(restaurantId);
    const oldCuisines = await client.sMembers(restaurantCuisinesKey);
    const newCuisines = normalizedCuisines;

    const cuisinesToAdd = newCuisines.filter((c) => !oldCuisines.includes(c));
    const cuisinesToRemove = oldCuisines.filter((c) => !newCuisines.includes(c));

    const operations = [client.hSet(restaurantKey, updatedHashData)];

    if (hasCoordinatesChanged) {
      console.log("Coordinates changed, invalidating the weather cache");
      operations.push(client.del(weatherKeyById(restaurantId)));
    }

    for (const cuisine of cuisinesToAdd) {
      operations.push(client.sAdd(cuisinesKey, cuisine));
      operations.push(client.sAdd(cuisineKey(cuisine), restaurantId));
      operations.push(client.sAdd(restaurantCuisinesKey, cuisine));
    }

    for (const cuisine of cuisinesToRemove) {
      operations.push(client.sRem(cuisineKey(cuisine), restaurantId));
      operations.push(client.sRem(restaurantCuisinesKey, cuisine));
    }

    await Promise.all(operations);

    await publishRestaurantUpdate(client, {
      type: "RESTAURANT_UPDATED",
      restaurantId,
    });

    try {
      await appendDomainEvent(client, {
        eventId: nanoid(),
        eventType: "RESTAURANT_UPDATED",
        timestamp: Date.now(),
        actorUserId: c.get("user")?.id ?? null,
        entityId: restaurantId,
        entityType: "restaurant",
        payload: {
          restaurantId,
          locationChanged: hasCoordinatesChanged,
          cuisinesAdded: cuisinesToAdd,
          cuisinesRemoved: cuisinesToRemove,
        },
      });
    } catch (error) {
      console.error("Failed to append stream event RESTAURANT_UPDATED:", error);
    }
    notifyFollowers({
      type: "RESTAURANT_UPDATED",
      restaurantId,
      data: {
        restaurantName: newData.name,
        locationChanged: hasCoordinatesChanged,
      },
    }).catch((err) => console.error("Failed to notify followers:", err));

    return c.json(
      createSuccessResponse(updatedHashData, "Restaurant updated and cuisines were synchronized"),
    );
  },
);

router.patch(
  "/:restaurantId/status",
  requireAuth,
  requireRole("admin"),
  checkRestaurantExists,
  async (c) => {
    const client = await initializeRedisClient();
    const restaurantId = c.req.param("restaurantId");
    const restaurantKey = restaurantKeyById(restaurantId);

    const restaurantCuisinesKey = restaurantCuisinesKeyById(restaurantId);
    const cuisines = await client.sMembers(restaurantCuisinesKey);

    const pipeline = client.multi();

    pipeline.hSet(restaurantKey, "status", "deleted");

    pipeline.zRem(restaurantsByRatingKey, restaurantId);

    cuisines.forEach((cuisine) => {
      pipeline.sRem(cuisineKey(cuisine), restaurantId);
    });

    await pipeline.exec();

    for (const cuisine of cuisines) {
      const remaining = await client.sCard(cuisineKey(cuisine));
      if (remaining === 0) {
        await client.sRem(cuisinesKey, cuisine);
      }
    }

    return c.json(createSuccessResponse(null, "Restaurant soft-deleted successfully"), 200);
  },
);

router.put(
  "/:restaurantId/reviews/:reviewId",
  requireAuth,
  checkRestaurantExists,
  checkReviewExists,
  zValidator("json", ReviewCreateSchema),
  async (c) => {
    const restaurantId = c.req.param("restaurantId");
    const restaurantKey = restaurantKeyById(restaurantId);
    const user = c.get("user");

    const reviewId = c.req.param("reviewId");
    const reviewDetailsKey = reviewDetailsKeyById(reviewId);

    const client = await initializeRedisClient();
    const newData: ReviewCreate = c.req.valid("json");

    const existingReview = await client.hGetAll(reviewDetailsKey);

    if (existingReview.authorId && existingReview.authorId !== user!.id) {
      if (user!.role !== "admin") {
        return c.json(createErrorResponse("Forbidden - You can only edit your own reviews"), 403);
      }
    }

    const oldReviewData = await client.hGetAll(reviewDetailsKey);
    const oldRating = parseFloat(oldReviewData.rating || "0");
    const newRating = newData.rating;
    const ratingDifference = newRating - oldRating;

    const newTotalStarsString = await client.hIncrByFloat(
      restaurantKey,
      "totalStars",
      ratingDifference,
    );

    const reviewCount = await client.lLen(reviewKeyById(restaurantId));

    const newTotalStars = parseFloat(newTotalStarsString);
    const averageRating = Number((newTotalStars / reviewCount).toFixed(1));

    const finalReviewData = {
      ...oldReviewData,
      review: newData.review,
      rating: newData.rating,
    };

    await Promise.all([
      client.hSet(reviewDetailsKey, finalReviewData),
      client.hSet(restaurantKey, "avgStars", averageRating),
      client.zAdd(restaurantsByRatingKey, {
        score: averageRating,
        value: restaurantId,
      }),
    ]);

    await publishRestaurantUpdate(client, {
      type: "REVIEW_UPDATED",
      restaurantId,
      reviewId,
    });

    try {
      await appendDomainEvent(client, {
        eventId: nanoid(),
        eventType: "REVIEW_UPDATED",
        timestamp: Date.now(),
        actorUserId: user?.id ?? null,
        entityId: reviewId,
        entityType: "review",
        payload: {
          restaurantId,
          reviewId,
          oldRating,
          newRating,
        },
      });
    } catch (error) {
      console.error("Failed to append stream event REVIEW_UPDATED:", error);
    }

    return c.json(
      createSuccessResponse(finalReviewData, "Review updated, total rating was recalculated"),
    );
  },
);

router.put(
  "/:restaurantId/details",
  requireAuth,
  checkRestaurantExists,
  zValidator("json", RestaurantDetailsSchema),
  async (c) => {
    const restaurantId = c.req.param("restaurantId");
    const validatedData: RestaurantDetails = c.req.valid("json");
    const client = await initializeRedisClient();

    const restaurantDetailsKey = restaurantDetailsKeyById(restaurantId);

    await client.json.set(restaurantDetailsKey, ".", validatedData);

    const responseBody = createSuccessResponse(validatedData, "Restaurant details updated");

    return c.json(responseBody, 200);
  },
);

router.delete("/:restaurantId/reviews/:reviewId", requireAuth, checkRestaurantExists, async (c) => {
  const restaurantId = c.req.param("restaurantId");
  const reviewId = c.req.param("reviewId");
  const client = await initializeRedisClient();

  const user = c.get("user");

  if (!user) {
    return c.json(createErrorResponse("User was not found while deleting review"), 404);
  }

  const reviewKey = reviewKeyById(restaurantId);
  const reviewDetailsKey = reviewDetailsKeyById(reviewId);
  const restaurantKey = restaurantKeyById(restaurantId);

  const reviewToDelete = await client.hGetAll(reviewDetailsKey);

  if (!reviewToDelete.id) {
    return c.json(createErrorResponse("Review not found"), 404);
  }

  if (reviewToDelete.authorId && reviewToDelete.authorId !== user.id) {
    if (user.role !== "admin") {
      return c.json(createErrorResponse("Forbidden - You can only delete your own reviews"), 403);
    }
  }

  const [removeResult, deleteResult] = await Promise.all([
    client.lRem(reviewKey, 0, reviewId),
    client.del(reviewDetailsKey),
  ]);

  const deletedRating = parseFloat(reviewToDelete.rating || "0");

  const newTotalStarsString = await client.hIncrByFloat(
    restaurantKey,
    "totalStars",
    -deletedRating,
  );

  const newReviewCount = await client.lLen(reviewKey);
  const newTotalStars = parseFloat(newTotalStarsString);
  const averageRating =
    newReviewCount === 0 ? 0 : Number((newTotalStars / newReviewCount).toFixed(1));

  await Promise.all([
    client.hSet(restaurantKey, "avgStars", averageRating),
    client.zAdd(restaurantsByRatingKey, {
      score: averageRating,
      value: restaurantId,
    }),
  ]);

  await publishRestaurantUpdate(client, {
    type: "REVIEW_DELETED",
    restaurantId,
    reviewId,
  });

  try {
    await appendDomainEvent(client, {
      eventId: nanoid(),
      eventType: "REVIEW_DELETED",
      timestamp: Date.now(),
      actorUserId: c.get("user")?.id ?? null,
      entityId: reviewId,
      entityType: "review",
      payload: {
        restaurantId,
        reviewId,
      },
    });
  } catch (error) {
    console.error("Failed to append stream event REVIEW_DELETED:", error);
  }

  const responseBody = createSuccessResponse(
    {
      reviewId,
      listRemoved: removeResult > 0,
      hashDeleted: deleteResult > 0,
    },
    "Review deleted",
  );
  return c.json(responseBody, 200);
});

export default router;
