import { redirect } from "react-router-dom";
import { supabase } from "./supabaseClient";

export const protectedLoader = async () => {
  console.log("[protectedLoader] Loader is running..."); // See if this loader is ever triggered

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    console.error(
      "[protectedLoader] DECISION: No session. Throwing redirect to /home."
    );
    throw redirect("/home");
  }

  console.log("[protectedLoader] Session found. Allowing access.");
  return null;
};
