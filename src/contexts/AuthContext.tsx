import { createContext, useContext, useState, ReactNode } from "react";
import { loginApi } from "@/api/services/auth.service";

interface AuthContextType {
  isAuthenticated: boolean;
  adminEmail: string;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const ADMIN_EMAIL_KEY = "adminEmail";

const getStoredAuthState = () => {
  try {
    const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY) ?? "";
    const adminEmail = window.localStorage.getItem(ADMIN_EMAIL_KEY) ?? "";
    return {
      isAuthenticated: Boolean(accessToken),
      adminEmail,
    };
  } catch {
    return { isAuthenticated: false, adminEmail: "" };
  }
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => getStoredAuthState().isAuthenticated);
  const [adminEmail, setAdminEmail] = useState(() => getStoredAuthState().adminEmail);

  const login = async (email: string, password: string) => {
    try {
      const response = await loginApi({ email, password });
      if (!response.accessToken || !response.user?.email) {
        return false;
      }

      try {
        window.localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
        window.localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
        window.localStorage.setItem(ADMIN_EMAIL_KEY, response.user.email);
      } catch {
        // Ignore storage write failures; keep in-memory auth state usable.
      }
      setIsAuthenticated(true);
      setAdminEmail(response.user.email);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    try {
      window.localStorage.removeItem(ACCESS_TOKEN_KEY);
      window.localStorage.removeItem(REFRESH_TOKEN_KEY);
      window.localStorage.removeItem(ADMIN_EMAIL_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }
    setIsAuthenticated(false);
    setAdminEmail("");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, adminEmail, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
