import { betterAuth } from "better-auth";
import { admin as adminPlugin } from "better-auth/plugins";
import { Database } from "bun:sqlite";
import { ac, admin, owner, user } from "./permissions";

export const auth = betterAuth({
  database: new Database("database.sqlite"),
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
