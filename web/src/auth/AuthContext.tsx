import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { trackEvent } from "../analytics/pendo";
import { authApi, type Account, type User } from "../api/auth";
import { clearSession, readSession, saveSession } from "./session";

interface AuthState {
  user: User | null;
  account: Account | null;
  /** Signs in. `redirectPath` is the page the user goes to next, recorded with the sign-in. */
  signIn: (email: string, password: string, redirectPath?: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Replaces the signed-in user's details, after they edit their profile. */
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthState | null>(null);

/** Holds the signed-in user and their account (company), and signs in and out against the Tripwise API. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(readSession);

  const signIn = useCallback(async (email: string, password: string, redirectPath?: string) => {
    const signedIn = await authApi.signIn(email, password);
    saveSession(signedIn);
    setSession(signedIn);
    // Pendo Track Event: a new sign-in succeeded. The Pendo agent attaches the visitor and account ids.
    trackEvent("sign_in_completed", {
      role: signedIn.user.role,
      accountPlan: signedIn.account.plan,
      redirectPath: redirectPath ?? "",
    });
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authApi.signOut();
    } finally {
      clearSession();
      setSession(null);
    }
  }, []);

  const updateUser = useCallback((user: User) => {
    setSession((current) => {
      if (!current) return current;
      const updated = { ...current, user };
      saveSession(updated);
      return updated;
    });
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user: session?.user ?? null,
      account: session?.account ?? null,
      signIn,
      signOut,
      updateUser,
    }),
    [session, signIn, signOut, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return auth;
}
