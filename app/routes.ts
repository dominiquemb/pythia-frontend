// app/routes.ts
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Public route
  route("login", "./routes/login.tsx"),

  // This wrapper now handles all client-side auth checks
  route("", "./protectedRoute/protectedRoute.tsx", [
    // Protected routes go here
    index("./routes/home.tsx"),
    // route("dashboard", "./routes/dashboard.tsx"),
  ]),
] satisfies RouteConfig;
