import * as z from "zod";
import { sqliteTable, type AnySQLiteColumn, text, integer, numeric, index, foreignKey } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

export const RestaurantSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  cuisines: z.array(z.string().min(1)),
});

export const RestaurantDetailsSchema = z.object({
  links: z.array(z.object({ name: z.string().min(1), url: z.string().min(1) })),
  contacts: z.object({ phone: z.string().min(1), email: z.email() }),
});

export const ReviewSchema = z.object({
  review: z.string().min(1),
  rating: z.number().min(1).max(5),
});

export type Restaurant = z.infer<typeof RestaurantSchema>;
export type RestaurantDetails = z.infer<typeof RestaurantDetailsSchema>;
export type Review = z.infer<typeof ReviewSchema>;

export const user = sqliteTable("user", {
  id: text().primaryKey().notNull(),
  name: text().notNull(),
  email: text().notNull(),
  emailVerified: integer().notNull(),
  image: text(),
  createdAt: numeric().notNull(),
  updatedAt: numeric().notNull(),
  role: text(),
  banned: integer(),
  banReason: text(),
  banExpires: numeric(),
});

export const session = sqliteTable("session", {
  id: text().primaryKey().notNull(),
  expiresAt: numeric().notNull(),
  token: text().notNull(),
  createdAt: numeric().notNull(),
  updatedAt: numeric().notNull(),
  ipAddress: text(),
  userAgent: text(),
  userId: text().notNull().references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text(),
},
  (table) => [
    index("session_userId_idx").on(table.userId),
  ]);

export const account = sqliteTable("account", {
  id: text().primaryKey().notNull(),
  accountId: text().notNull(),
  providerId: text().notNull(),
  userId: text().notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: numeric(),
  refreshTokenExpiresAt: numeric(),
  scope: text(),
  password: text(),
  createdAt: numeric().notNull(),
  updatedAt: numeric().notNull(),
},
  (table) => [
    index("account_userId_idx").on(table.userId),
  ]);

export const verification = sqliteTable("verification", {
  id: text().primaryKey().notNull(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: numeric().notNull(),
  createdAt: numeric().notNull(),
  updatedAt: numeric().notNull(),
},
  (table) => [
    index("verification_identifier_idx").on(table.identifier),
  ]);
