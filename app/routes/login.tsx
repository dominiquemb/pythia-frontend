// app/routes/login.tsx
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
// ❌ REMOVE the static import from here
// import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

export default function Login() {
  const navigate = useNavigate();

  // ✅ STEP 1: Create state to hold the dynamically imported component
  // We initialize it to null. We use 'any' for simplicity here.
  const [AuthComponent, setAuthComponent] = useState<any>(null);

  // ✅ STEP 2: Use useEffect to dynamically import the Auth component on the client
  useEffect(() => {
    // The import() function returns a Promise
    import("@supabase/auth-ui-react")
      .then(({ Auth }) => setAuthComponent(() => Auth)) // We store the actual Auth component in state
      .catch((error) => console.error("Failed to load Auth component", error));
  }, []); // The empty dependency array ensures this runs only once on mount

  // --- Redirect Effect (this part is fine) ---
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/", { replace: true });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // --- Render Component ---

  // ✅ STEP 3: Render a loading state or null until the component is loaded
  if (!AuthComponent) {
    return null; // Or a loading spinner
  }

  // Once AuthComponent is loaded, render it
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="w-96 p-8 bg-white rounded-lg shadow-md">
        <AuthComponent
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={["github"]}
        />
      </div>
    </div>
  );
}
