"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { createAppTheme } from "@/theme/theme";

type ColorMode = "light" | "dark";

interface ColorModeContextValue {
  mode: ColorMode;
  toggleMode: () => void;
  setMode: (mode: ColorMode) => void;
}

const ColorModeContext = createContext<ColorModeContextValue>({
  mode: "light",
  toggleMode: () => undefined,
  setMode: () => undefined,
});

export function useColorMode(): ColorModeContextValue {
  return useContext(ColorModeContext);
}

const STORAGE_KEY = "event-calendar-color-mode";

function readStoredMode(): ColorMode | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* private mode */
  }
  return null;
}

function writeStoredMode(mode: ColorMode): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* private mode */
  }
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ColorMode>("light");

  useEffect(() => {
    const stored = readStoredMode();
    if (stored) {
      setModeState(stored);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setModeState("dark");
    }
  }, []);

  const setMode = useCallback((next: ColorMode) => {
    setModeState(next);
    writeStoredMode(next);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next = prev === "light" ? "dark" : "light";
      writeStoredMode(next);
      return next;
    });
  }, []);

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const value = useMemo(
    () => ({ mode, toggleMode, setMode }),
    [mode, toggleMode, setMode]
  );

  return (
    <AppRouterCacheProvider>
      <ColorModeContext.Provider value={value}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </ColorModeContext.Provider>
    </AppRouterCacheProvider>
  );
}
