import React, { createContext, useContext, useState, useEffect } from "react";
import { authService, setToken, getToken, removeToken } from "../services/api";
import type { User } from "../services/api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize session on startup
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await authService.me();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          removeToken();
        }
      } catch (err: any) {
        console.error("Session restore failed:", err);
        removeToken();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen to token expiration events from Axios interceptor
    const handleAuthExpired = () => {
      setUser(null);
      removeToken();
    };

    window.addEventListener("auth-expired", handleAuthExpired);
    return () => {
      window.removeEventListener("auth-expired", handleAuthExpired);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login({ email, password });
      if (response.success && response.token) {
        setToken(response.token);
        setUser(response.user);
      } else {
        throw new Error("Login failed. No token returned.");
      }
    } catch (err: any) {
      const errMsg = err.message || "Invalid email or password.";
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register({ name, email, password });
      if (response.success && response.token) {
        setToken(response.token);
        setUser(response.user);
      } else {
        throw new Error("Registration failed. No token returned.");
      }
    } catch (err: any) {
      const errMsg = err.message || "Failed to create account.";
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
