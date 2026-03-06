import { sqliteTable, text, integer, numeric, index, uniqueIndex } from "drizzle-orm/sqlite-core"

export const user = sqliteTable("user", {
  id: text().primaryKey().notNull(),
  name: text().notNull(),
  email: text().notNull(),
  emailVerified: integer({ mode: "boolean" }).notNull(),
  image: text(),
  createdAt: numeric().notNull(),
  updatedAt: numeric().notNull(),
  role: text(),
  banned: integer({ mode: "boolean" }),
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

export const restaurantFollows = sqliteTable("restaurant_follows", {
  id: text().primaryKey().notNull(),
  userId: text().notNull().references(() => user.id, { onDelete: "cascade" }),
  restaurantId: text().notNull(),
  createdAt: numeric().notNull(),
},
  (table) => [
    index("follows_userId_idx").on(table.userId),
    index("follows_restaurantId_idx").on(table.restaurantId),
    uniqueIndex("follows_user_restaurant_unq").on(table.userId, table.restaurantId),
  ]);

export const notifications = sqliteTable("notifications", {
  id: text().primaryKey().notNull(),
  userId: text().notNull().references(() => user.id, { onDelete: "cascade" }),
  type: text().notNull(),
  restaurantId: text().notNull(),
  data: text().notNull(),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  createdAt: numeric().notNull(),
},
  (table) => [
    index("notifications_userId_idx").on(table.userId),
    index("notifications_userId_read_idx").on(table.userId, table.read),
  ]);
