import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Leaf } from "lucide-react";

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        className="flex h-screen w-screen items-center justify-center"
        style={{ background: "#ece8f4" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg">
            <Leaf className="h-7 w-7" />
          </div>
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-200 border-t-emerald-500" />
          <p
            className="text-sm font-medium text-gray-500 tracking-wide"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Restoring session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
