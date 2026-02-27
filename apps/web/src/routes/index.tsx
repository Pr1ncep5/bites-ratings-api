import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageLoader } from "@/components/page-loader";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    if (!context.auth.session) {
      throw redirect({ to: "/login" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/"!
    <PageLoader />
  </div>;
}
