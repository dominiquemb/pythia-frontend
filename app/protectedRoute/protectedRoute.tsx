// app/ProtectedRoute/ProtectedRoute.jsx
import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
// ✅ 1. Import your custom hook
import { useSession } from "../lib/SessionContext";

const ProtectedRoute = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // ✅ 2. Call your custom hook directly
  const { session, loading } = useSession();

  if (!isClient || loading) {
    return <div>Loading...</div>;
  }

  return session ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
