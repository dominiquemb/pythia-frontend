// routes/home.tsx
import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import Astrology from "~/astrology/astrology";

console.log("Home route loaded");

export default function Home() {
  return <Astrology />;
}
