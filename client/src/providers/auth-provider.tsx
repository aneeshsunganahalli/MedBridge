"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, UserRole, LoginRequest, RegisterRequest } from "@/types";
import { authApi } from "@/lib/api";
import { getToken, setToken, removeToken, decodeToken, isTokenExpired } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    router.push("/login");
  }, [router]);

  const checkAuth = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    if (isTokenExpired(token)) {
      logout();
      setIsLoading(false);
      return;
    }

    try {
      const profile = await authApi.getMe();
      setUser(profile);
    } catch (error) {
      console.error("Auth verification failed:", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  // Handle auto-logout on token expiration
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const payload = decodeToken(token);
    if (!payload) return;

    const timeLeft = payload.exp * 1000 - Date.now();
    if (timeLeft <= 0) {
      logout();
      return;
    }

    const timer = setTimeout(() => {
      logout();
      alert("Your session has expired. Please log in again.");
    }, timeLeft);

    return () => clearTimeout(timer);
  }, [user, logout]);

  // Initial load auth check
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Protect client routing
  useEffect(() => {
    if (isLoading) return;

    const token = getToken();
    const isPublicRoute =
      pathname === "/login" || pathname === "/register" || pathname.startsWith("/shared/");

    if (!token && !isPublicRoute) {
      router.push("/login");
    } else if (token && user) {
      if (pathname === "/login" || pathname === "/register" || pathname === "/") {
        // Redirect to dashboard based on role
        if (user.role === "patient") {
          router.push("/patient/dashboard");
        } else if (user.role === "doctor") {
          router.push("/doctor/dashboard");
        }
      } else if (pathname.startsWith("/patient/") && user.role !== "patient") {
        router.push("/doctor/dashboard");
      } else if (pathname.startsWith("/doctor/") && user.role !== "doctor") {
        router.push("/patient/dashboard");
      }
    }
  }, [pathname, user, isLoading, router]);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(credentials);
      setToken(response.access_token);
      const profile = await authApi.getMe();
      setUser(profile);
      
      if (profile.role === "patient") {
        router.push("/patient/dashboard");
      } else {
        router.push("/doctor/dashboard");
      }
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      await authApi.register(data);
      // Auto login after registration
      await login({ email: data.email, password: data.password });
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const role = user?.role || null;
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
