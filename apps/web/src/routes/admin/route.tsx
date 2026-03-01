import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { data } = await authClient.getSession();

    if (!data?.user || data.user.role !== "admin") {
      throw redirect({ to: "/" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return <Outlet />;
}
