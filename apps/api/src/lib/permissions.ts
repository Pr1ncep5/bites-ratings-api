import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

const statement = {
  ...defaultStatements,
  restaurant: ["create", "update", "delete"],
  review: ["create", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

export const user = ac.newRole({
  review: ["create", "update", "delete"],
});

export const admin = ac.newRole({
  ...adminAc.statements,
  restaurant: ["create", "update", "delete"],
  review: ["create", "update", "delete"],
});

export const owner = ac.newRole({
  restaurant: ["update"],
  review: ["create", "update", "delete"],
});
