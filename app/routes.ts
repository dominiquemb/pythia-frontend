// app/routes.ts
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Public routes
  route("home", "./routes/home.tsx"),

  route("login", "./routes/login.tsx"),

  // Pathless layout route for all protected pages
  route("", "./protectedRoute/protectedRoute.tsx", [
    // The homepage is the index of the protected section
    index("./routes/astrology.tsx"),

    // Chart viewer page
    route("chart-viewer", "./routes/chart-viewer.tsx"),

    // Password reset page (protected - user has session from email link)
    route("reset-password", "./routes/reset-password.tsx"),
  ]),
] satisfies RouteConfig;
