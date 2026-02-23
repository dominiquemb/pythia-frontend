// app/lib/AuthRedirector.tsx
import { useEffect, useContext } from "react"; // ✅ Add useContext
import { useLocation, useNavigate } from "react-router-dom";
import { SessionContext } from "./SessionContext"; // ✅ Import the context directly

export function AuthRedirector() {
  // ✅ Use the standard useContext hook
  const { session, loading } = useContext(SessionContext);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    // Check for password recovery in URL hash
    const hash = window.location.hash;
    console.log('[AuthRedirector] Full URL:', window.location.href);
    console.log('[AuthRedirector] Full hash:', hash);

    const hashParams = new URLSearchParams(hash.substring(1));
    const type = hashParams.get('type');
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    console.log('[AuthRedirector] Extracted type:', type);
    console.log('[AuthRedirector] Has access_token:', !!accessToken);
    console.log('[AuthRedirector] Has refresh_token:', !!refreshToken);

    // Check if this is a recovery flow (either type=recovery or has tokens in hash)
    if (type === 'recovery' || (accessToken && refreshToken)) {
      console.log('[AuthRedirector] Password recovery detected! Redirecting to /reset-password');
      navigate('/reset-password', { replace: true });
      return;
    }

    // This logging logic is still helpful for debugging
    console.log("AuthRedirector: Checking state...", {
      isLoading: loading,
      hasSession: !!session,
      pathname,
    });

    if (loading) {
      console.log("AuthRedirector: Still loading, will not redirect yet.");
      return;
    }

    const isAuthPage = pathname === "/login" || pathname === "/home";

    if (session && isAuthPage) {
      console.log(
        "AuthRedirector: DECISION - User is logged in and on the login page. Redirecting to '/'."
      );
      navigate("/", { replace: true });
    } else {
      console.log(
        "AuthRedirector: No redirection needed based on current state."
      );
    }
  }, [session, loading, navigate, pathname]);

  // This component renders no visible UI
  return null;
}
