"use client";

import {
  AppBar,
  Box,
  Container,
  IconButton,
  Toolbar,
  Typography,
  Tooltip,
  Button,
} from "@mui/material";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import Link from "next/link";
import { useColorMode } from "@/theme/ThemeRegistry";

interface SiteHeaderProps {
  title?: string;
  showAdminLink?: boolean;
}

export function SiteHeader({
  title = "Event Kalender",
  showAdminLink = true,
}: SiteHeaderProps) {
  const { mode, toggleMode } = useColorMode();

  return (
    <AppBar position="sticky" color="transparent" elevation={0}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: 1, minHeight: 64 }}>
          <EventNoteOutlinedIcon color="primary" />
          <Typography
            variant="h6"
            component={Link}
            href="/"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              textDecoration: "none",
              color: "inherit",
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </Typography>

          <Tooltip title={mode === "light" ? "Dunkelmodus" : "Hellmodus"}>
            <IconButton onClick={toggleMode} color="inherit" aria-label="Farbmodus wechseln">
              {mode === "light" ? (
                <DarkModeOutlinedIcon />
              ) : (
                <LightModeOutlinedIcon />
              )}
            </IconButton>
          </Tooltip>

          {showAdminLink && (
            <Button
              component={Link}
              href="/admin"
              startIcon={<AdminPanelSettingsOutlinedIcon />}
              size="small"
              sx={{ display: { xs: "none", sm: "inline-flex" } }}
            >
              Admin
            </Button>
          )}
          {showAdminLink && (
            <Box sx={{ display: { xs: "block", sm: "none" } }}>
              <IconButton
                component={Link}
                href="/admin"
                color="inherit"
                aria-label="Adminbereich"
              >
                <AdminPanelSettingsOutlinedIcon />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
