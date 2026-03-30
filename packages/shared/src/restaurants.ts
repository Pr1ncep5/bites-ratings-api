import z from "zod";

export const RestaurantStatusEnum = z.enum(["active", "permanently_closed", "deleted"]);

export const RestaurantCreateSchema = z.object({
  name: z.string().trim().min(1),
  location: z.string().trim().min(1),
  cuisines: z.array(z.string().trim().min(1)).min(1, "At least one cuisine is required"),
});

export const RestaurantResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string(),
  ownerId: z.string().nullable().default(null),
  avgStars: z.coerce.number().default(0),
  totalStars: z.coerce.number().default(0),
  viewCount: z.coerce.number().default(0),
  cuisines: z.array(z.string()),
  status: RestaurantStatusEnum.default("active"),
});

export const RestaurantDetailsSchema = z.object({
  links: z.array(z.object({ name: z.string().min(1), url: z.string().min(1) })).optional(),
  contacts: z.object({ phone: z.string().min(1), email: z.email() }).optional(),
});

export type RestaurantCreate = z.infer<typeof RestaurantCreateSchema>;
export type RestaurantListItem = z.infer<typeof RestaurantResponseSchema>;
export type RestaurantDetails = z.infer<typeof RestaurantDetailsSchema>;
export type RestaurantStatus = z.infer<typeof RestaurantStatusEnum>;

export type PaginatedRestaurants = {
  restaurants: RestaurantListItem[];
  hasMore: boolean;
  page: number;
};
