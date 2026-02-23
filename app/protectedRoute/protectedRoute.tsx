// app/protectedRoute/protectedRoute.tsx
import React, { createContext, useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom"; // ✅ React Router navigation

type SessionContextType = {
  session: Session | null;
  loading: boolean;
};

export const SessionContext = createContext<SessionContextType>({
  session: null,
  loading: true,
});

export const SessionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for password recovery in URL hash
    const hash = window.location.hash;
    console.log('[SessionProvider] Full URL:', window.location.href);
    console.log('[SessionProvider] Full hash:', hash);

    const hashParams = new URLSearchParams(hash.substring(1));
    const type = hashParams.get('type');
    console.log('[SessionProvider] Extracted type:', type);

    if (type === 'recovery') {
      console.log('[SessionProvider] Password recovery detected! Redirecting to /reset-password');
      navigate('/reset-password', { replace: true });
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // ✅ Redirect to /login when not authenticated
  useEffect(() => {
    // Add these logs to see the decision-making process
    console.log("[SessionProvider] Checking auth state...", {
      loading,
      hasSession: !!session,
    });

    if (!loading && !session) {
      // Use console.error to make this log stand out in the console
      console.error(
        "[SessionProvider] DECISION: No session found. Redirecting to /home."
      );
      navigate("/home", { replace: true });
    } else {
      console.log(
        "[SessionProvider] No redirect needed (still loading or session exists)."
      );
    }
  }, [loading, session, navigate]);

  const value = useMemo(
    () => ({
      session,
      loading,
    }),
    [session, loading]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};
