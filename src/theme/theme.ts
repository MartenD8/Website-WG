"use client";

import { createTheme, alpha } from "@mui/material/styles";

/**
 * Material Design 3 inspired theme – dual light/dark.
 * Soft elevation, rounded shapes, tonal surfaces.
 */
export function createAppTheme(mode: "light" | "dark") {
  const isDark = mode === "dark";

  const primary = isDark ? "#A8C7FA" : "#1B5EAA";
  const secondary = isDark ? "#B9C8DA" : "#4A6075";
  const tertiary = isDark ? "#E0B6FF" : "#6B4EA2";
  const surface = isDark ? "#111318" : "#F8F9FC";
  const surfaceContainer = isDark ? "#1D2024" : "#EEF0F4";
  const onSurface = isDark ? "#E2E2E6" : "#1A1C1E";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: primary,
        contrastText: isDark ? "#062E6F" : "#FFFFFF",
      },
      secondary: {
        main: secondary,
        contrastText: isDark ? "#233044" : "#FFFFFF",
      },
      background: {
        default: surface,
        paper: isDark ? "#1A1C20" : "#FFFFFF",
      },
      text: {
        primary: onSurface,
        secondary: isDark ? "#C3C6CF" : "#43474E",
      },
      divider: isDark ? alpha("#E2E2E6", 0.12) : alpha("#1A1C1E", 0.12),
      error: { main: isDark ? "#FFB4AB" : "#BA1A1A" },
      success: { main: isDark ? "#81C995" : "#146C2E" },
      warning: { main: isDark ? "#FDD663" : "#B06000" },
      info: { main: isDark ? "#A8C7FA" : "#1B5EAA" },
    },
    shape: {
      borderRadius: 16,
    },
    typography: {
      fontFamily: [
        "var(--font-roboto)",
        "Roboto",
        "Helvetica",
        "Arial",
        "sans-serif",
      ].join(","),
      h1: {
        fontWeight: 600,
        letterSpacing: "-0.02em",
        fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
      },
      h2: {
        fontWeight: 600,
        letterSpacing: "-0.01em",
        fontSize: "clamp(1.35rem, 3vw, 2rem)",
      },
      h3: { fontWeight: 600, fontSize: "1.35rem" },
      h4: { fontWeight: 600, fontSize: "1.15rem" },
      button: {
        textTransform: "none",
        fontWeight: 600,
        letterSpacing: "0.01em",
      },
      body1: { lineHeight: 1.65 },
      body2: { lineHeight: 1.55 },
    },
    shadows: [
      "none",
      isDark
        ? "0 1px 2px rgba(0,0,0,0.4)"
        : "0 1px 2px rgba(26,28,30,0.06)",
      isDark
        ? "0 2px 6px rgba(0,0,0,0.45)"
        : "0 2px 8px rgba(26,28,30,0.08)",
      isDark
        ? "0 4px 12px rgba(0,0,0,0.5)"
        : "0 4px 16px rgba(26,28,30,0.1)",
      isDark
        ? "0 8px 24px rgba(0,0,0,0.55)"
        : "0 8px 28px rgba(26,28,30,0.12)",
      ...Array(20).fill(
        isDark
          ? "0 12px 32px rgba(0,0,0,0.6)"
          : "0 12px 40px rgba(26,28,30,0.14)"
      ),
    ] as unknown as ReturnType<typeof createTheme>["shadows"],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundImage: isDark
              ? `radial-gradient(ellipse 120% 80% at 10% -20%, ${alpha(primary, 0.18)}, transparent 50%),
                 radial-gradient(ellipse 80% 60% at 100% 0%, ${alpha(tertiary, 0.12)}, transparent 45%),
                 linear-gradient(180deg, ${surface} 0%, ${surfaceContainer} 100%)`
              : `radial-gradient(ellipse 120% 80% at 10% -20%, ${alpha(primary, 0.12)}, transparent 50%),
                 radial-gradient(ellipse 80% 60% at 100% 0%, ${alpha(tertiary, 0.08)}, transparent 45%),
                 linear-gradient(180deg, ${surface} 0%, #E8ECF2 100%)`,
            backgroundAttachment: "fixed",
            minHeight: "100vh",
          },
          "::-webkit-scrollbar": { width: 8, height: 8 },
          "::-webkit-scrollbar-thumb": {
            backgroundColor: alpha(onSurface, 0.25),
            borderRadius: 8,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            paddingInline: 20,
            paddingBlock: 8,
            boxShadow: "none",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            "&:hover": {
              boxShadow: isDark
                ? `0 4px 16px ${alpha(primary, 0.35)}`
                : `0 4px 16px ${alpha(primary, 0.25)}`,
            },
          },
          contained: {
            "&:hover": { transform: "translateY(-1px)" },
          },
        },
        defaultProps: {
          disableElevation: true,
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            backgroundImage: "none",
            border: `1px solid ${alpha(onSurface, isDark ? 0.08 : 0.06)}`,
            transition:
              "transform 0.25s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.25s cubic-bezier(0.2, 0, 0, 1)",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
          rounded: {
            borderRadius: 20,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 28,
            border: `1px solid ${alpha(onSurface, 0.08)}`,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 600,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: "outlined",
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backdropFilter: "blur(16px)",
            backgroundColor: alpha(isDark ? "#1A1C20" : "#FFFFFF", 0.82),
            color: onSurface,
            boxShadow: "none",
            borderBottom: `1px solid ${alpha(onSurface, 0.08)}`,
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
        },
      },
    },
  });
}

/** MD3-ish tonal colors per exploration level */
export const LEVEL_COLORS: Record<
  1 | 2 | 3 | 4 | 5,
  { light: string; dark: string }
> = {
  1: { light: "#146C2E", dark: "#81C995" },
  2: { light: "#1B5EAA", dark: "#A8C7FA" },
  3: { light: "#7B5800", dark: "#FDD663" },
  4: { light: "#E65100", dark: "#FFB74D" },
  5: { light: "#C62828", dark: "#EF5350" },
};
