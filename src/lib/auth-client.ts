import { createAuthClient } from "better-auth/client";
import { adminClient } from "better-auth/client/plugins";
import { ac, admin, owner, user } from "./permissions";

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
  plugins: [
    adminClient({
      ac,
      roles: {
        admin,
        user,
        owner,
      },
    }),
  ],
});
