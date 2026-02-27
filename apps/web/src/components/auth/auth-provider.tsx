import { createContext, useContext } from "react";
import { authClient } from "@/lib/auth-client";
import { PageLoader } from "../page-loader";

type SessionData = typeof authClient.$Infer.Session;

export type AuthContextType = {
  session: SessionData["session"] | null;
  user: SessionData["user"] | null;
  isPending: boolean;
  error: Error | null;
  refetch: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending, error, refetch } = authClient.useSession();

  if (isPending) {
    return <PageLoader />;
  }

  return (
    <AuthContext
      value={{
        session: session?.session ?? null,
        user: session?.user ?? null,
        isPending,
        error: error ?? null,
        refetch,
      }}
    >
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
