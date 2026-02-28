import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/restaurants")({
  beforeLoad: async ({ context }) => {
    if (!context.auth.session) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => <Outlet />,
});
