import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "fifa_auth_session";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = ({ email, role = "organization", name = "" }) => {
    const userData = {
      email: email || (role === "fan" ? "fan@fifa.org" : "ops@fifa.org"),
      name: name || (role === "fan" ? "Alex Silva" : "C. Del Piero"),
      role: role, // 'fan' | 'organization'
      title: role === "fan" ? "Football Fan & Supporter" : "Lead Commissioner",
      avatar: role === "fan" ? "AS" : "CD",
      loginTime: new Date().toISOString(),
    };
    setUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role || null, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
