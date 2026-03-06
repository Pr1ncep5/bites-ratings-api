import { z } from "zod";
import type { RestaurantListItem } from "./restaurants";

export const SortOrderSchema = z.enum(["asc", "desc"]).default("asc");
export type SortOrder = z.infer<typeof SortOrderSchema>;

export interface AdminPaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  pageCount: number;
};

export type AdminRestaurantSortBy = Extract<
  keyof RestaurantListItem,
  "name" | "location" | "ownerId" | "avgStars" | "viewCount"
>;

export const AdminUserListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  emailVerified: z.boolean(),
  image: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  role: z.string().nullable().optional(),
  banned: z.boolean().nullable().optional(),
  banReason: z.string().nullable().optional(),
  banExpires: z.coerce.date().nullable().optional(),
});
export type AdminUserListItem = z.infer<typeof AdminUserListItemSchema>;

export type AdminUserSortBy = Extract<keyof AdminUserListItem,
  "name" | "email" | "role" | "createdAt" | "updatedAt"
>;
