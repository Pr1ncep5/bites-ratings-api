import * as React from "react";
import { Link, Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { AuthProvider } from "@/components/auth/auth-provider";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  auth: typeof authClient;
}>()({
  component: RootComponent,
  notFoundComponent: () => {
    return (
      <div>
        <p>This is the notFoundComponent configured on root route</p>
        <Link to="/">Start Over</Link>
      </div>
    );
  },
});

function RootComponent() {
  return (
    <React.Fragment>
      <Toaster />
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </React.Fragment>
  );
}
