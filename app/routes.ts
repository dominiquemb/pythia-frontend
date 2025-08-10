// app/routes.ts
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Public route
  route("home", "./routes/home.tsx"),

  route("login", "./routes/login.tsx"),

  // Pathless layout route for all protected pages
  route("", "./protectedRoute/protectedRoute.tsx", [
    // The homepage is the index of the protected section
    index("./routes/astrology.tsx"),

    // Other protected routes would go here
    // route("dashboard", "./routes/dashboard.tsx"),
  ]),
] satisfies RouteConfig;
