import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, getToken, setToken } from "./api";

// Two kinds of signed-in user:
//   "applicant" — registered, still completing verification / business details
//   "merchant"  — approved; can use the dashboard
const ROLE_KEY = "paytrixx_role";
const AuthContext = createContext(null);

const getRole = () => {
  try {
    return sessionStorage.getItem(ROLE_KEY);
  } catch {
    return null;
  }
};
const setRole = (r) => {
  try {
    if (r) sessionStorage.setItem(ROLE_KEY, r);
    else sessionStorage.removeItem(ROLE_KEY);
  } catch {
    /* storage unavailable — session just won't survive a reload */
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setTok] = useState(getToken());
  const [role, setRoleState] = useState(getRole());
  const [merchant, setMerchant] = useState(null);
  const [application, setApplication] = useState(null);

  const start = useCallback((data) => {
    setToken(data.token);
    setRole(data.role);
    setTok(data.token);
    setRoleState(data.role);
    setMerchant(data.merchant || null);
    setApplication(data.application || null);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setRole(null);
    setTok(null);
    setRoleState(null);
    setMerchant(null);
    setApplication(null);
  }, []);

  // Email + password: returns the role so the caller knows where to go next.
  const login = async (email, password) => {
    const data = await api("/api/auth/login", { method: "POST", body: { email, password } });
    start(data);
    return data.role;
  };

  // Approved merchants created by an admin (no password) sign in with their API key.
  const loginWithKey = async (apiKey) => {
    const data = await api("/api/merchant/login", { method: "POST", body: { apiKey } });
    start({ ...data, role: "merchant" });
    return "merchant";
  };

  const register = async (form) => {
    const data = await api("/api/auth/register", { method: "POST", body: form });
    start(data);
  };

  // Restore the profile after a page reload.
  useEffect(() => {
    if (!token) return;
    if (role === "merchant" && !merchant) {
      api("/api/merchant/me").then((r) => setMerchant(r.data)).catch(() => {});
    }
    if (role === "applicant" && !application) {
      api("/api/onboarding/me").then((r) => setApplication(r.application)).catch(() => {});
    }
  }, [token, role, merchant, application]);

  // api.js signals an expired session.
  useEffect(() => {
    window.addEventListener("paytrixx:logout", logout);
    return () => window.removeEventListener("paytrixx:logout", logout);
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{ token, role, merchant, setMerchant, application, setApplication, login, loginWithKey, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
