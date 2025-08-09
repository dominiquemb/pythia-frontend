// src/lib/loaders.ts
import { redirect } from "react-router-dom";
import { supabase } from "./supabaseClient";

export const protectedLoader = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw redirect("/login");
  }

  return null;
};
