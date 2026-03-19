import { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  adminEmail: string;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");

  const login = (email: string, password: string) => {
    if (email && password.length >= 6) {
      setIsAuthenticated(true);
      setAdminEmail(email);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAdminEmail("");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, adminEmail, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
