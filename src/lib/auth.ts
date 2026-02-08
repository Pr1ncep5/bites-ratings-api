import { betterAuth } from "better-auth";
import { admin as adminPlugin } from "better-auth/plugins";
import { Database } from "bun:sqlite";
import { initializeRedisClient } from "../utils/client";
import { ac, admin, owner, user } from "./permissions";

const redis = await initializeRedisClient();

export const auth = betterAuth({
  database: new Database("database.sqlite"),
  secondaryStorage: {
    get: async (key) => {
      return await redis.get(key);
    },
    set: async (key, value, ttl) => {
      if (ttl) await redis.set(key, value, { EX: ttl });
      else await redis.set(key, value);
    },
    delete: async (key) => {
      await redis.del(key);
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    adminPlugin({
      ac,
      roles: {
        admin,
        user,
        owner,
      },
    }),
  ],
  trustedOrigins: ["http://localhost:3000"],
  rateLimit: {
    enabled: true,
    storage: "secondary-storage",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": {
        window: 10,
        max: 3,
      },
      "/sign-up/email": {
        window: 60,
        max: 5,
      },
      "/forgot-password/*": {
        window: 60,
        max: 3,
      },
    },
  },
});

export type AuthType = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};
