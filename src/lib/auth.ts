import { betterAuth } from "better-auth";
import { admin as adminPlugin } from "better-auth/plugins";
import { Database } from "bun:sqlite";
import { createClient } from "redis";
import { ac, admin, owner, user } from "./permissions";

const redis = createClient();
await redis.connect();

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
});

export type AuthType = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};
