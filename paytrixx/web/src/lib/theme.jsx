import { createContext, useContext, useEffect, useState, useCallback } from "react";

// preference: "light" | "dark" | "system". The inline script in index.html applies the
// saved choice before first paint; this keeps it in sync afterwards.
const KEY = "paytrixx-theme";
const ThemeContext = createContext(null);

const readPref = () => {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
};

const systemIsDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

const apply = (pref) => {
  const dark = pref === "dark" || (pref === "system" && systemIsDark());
  document.documentElement.dataset.theme = dark ? "dark" : "light";
};

export const ThemeProvider = ({ children }) => {
  const [pref, setPrefState] = useState(readPref);

  const setPref = useCallback((p) => {
    setPrefState(p);
    try {
      if (p === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, p);
    } catch {
      /* storage blocked — choice just won't persist */
    }
  }, []);

  useEffect(() => {
    apply(pref);
    if (pref !== "system") return undefined;
    // Follow OS changes live while in system mode.
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref]);

  return <ThemeContext.Provider value={{ pref, setPref }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
