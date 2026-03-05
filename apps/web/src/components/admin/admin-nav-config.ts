import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Store, Users } from "lucide-react";

export type AdminNavItem = {
  title: string;
  to: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const adminNavItems: AdminNavItem[] = [
  {
    title: "Dashboard",
    to: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: "Restaurants",
    to: "/admin/restaurants",
    icon: Store,
  },
  {
    title: "Users",
    to: "/admin/users",
    icon: Users,
  },
];

export function getAdminPageTitle(pathname: string) {
  const exactMatch = adminNavItems.find((item) => item.exact && item.to === pathname);
  if (exactMatch) {
    return exactMatch.title;
  }

  const prefixMatch = adminNavItems.find((item) => !item.exact && pathname.startsWith(item.to));
  if (prefixMatch) {
    return prefixMatch.title;
  }

  return "Admin";
}
