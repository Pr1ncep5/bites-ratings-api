import { createFileRoute, redirect } from "@tanstack/react-router";
import { SignupForm } from "@/components/auth/signup-form";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/signup")({
  beforeLoad: async () => {
    // if (context.auth.session) {
    //   throw redirect({ to: "/" });
    // }
    const { data } = await authClient.getSession();

    if (data?.session) {
      throw redirect({ to: "/" });
    }
  },
  component: SignupPage,
});

function SignupPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignupForm />
      </div>
    </div>
  );
}
