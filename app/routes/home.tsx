// routes/home.tsx
import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import Astrology from "~/astrology/astrology";

// 1. Import the loader from your library
import { protectedLoader } from "../lib/loaders";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

// 2. Export the loader function
export const loader = protectedLoader;

export default function Home() {
  return <Astrology />;
}
