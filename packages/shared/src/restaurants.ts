import z from "zod";

export const RestaurantCreateSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  cuisines: z.array(z.string().min(1)),
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
});

export const RestaurantDetailsSchema = z.object({
  links: z.array(z.object({ name: z.string().min(1), url: z.string().min(1) })).optional(),
  contacts: z.object({ phone: z.string().min(1), email: z.email() }).optional(),
});

export type RestaurantCreate = z.infer<typeof RestaurantCreateSchema>;
export type RestaurantListItem = z.infer<typeof RestaurantResponseSchema>;
export type RestaurantDetails = z.infer<typeof RestaurantDetailsSchema>;

export type PaginatedRestaurants = {
  restaurants: RestaurantListItem[];
  hasMore: boolean;
  page: number;
};
