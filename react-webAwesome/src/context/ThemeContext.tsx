// ThemeContext.tsx

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { BRAND_TOKENS, DEFAULT_BRAND, DARK_KEY, BRAND_KEY } from "@/const";

interface ThemeContextValue {
  dark: boolean;
  setDark: (value: boolean) => void;
  brand: string;
  setBrand: (value: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [dark, setDark] = useState(() => localStorage.getItem(DARK_KEY) === "true");
  const [brand, setBrand] = useState(() => localStorage.getItem(BRAND_KEY) ?? DEFAULT_BRAND);

  useEffect(() => {
    document.documentElement.classList.toggle("wa-dark", dark);
    localStorage.setItem(DARK_KEY, String(dark));
  }, [dark]);

  useEffect(() => {
    const root = document.documentElement;
    BRAND_TOKENS.forEach((token) => root.style.setProperty(token, brand));
    localStorage.setItem(BRAND_KEY, brand);
  }, [brand]);

  return (
    <ThemeContext.Provider value={{ dark, setDark, brand, setBrand }}>
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
};
