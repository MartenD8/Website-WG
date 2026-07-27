"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import type { Event } from "@/types";
import { formatDisplayDate, isFinaleRangeDate } from "@/lib/calendar";
import { ExplorationBadge } from "@/components/ExplorationBadge";
import { EventFormDialog } from "@/components/admin/EventFormDialog";

interface AdminDashboardProps {
  initialEvents: Event[];
  username: string;
}

export function AdminDashboard({ initialEvents, username }: AdminDashboardProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [editing, setEditing] = useState<Event | null>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const existingDates = useMemo(() => events.map((e) => e.date), [events]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  async function toggleActive(event: Event) {
    setError(null);
    const res = await fetch(`/api/events/${event.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: event.date,
        title: event.title,
        description: event.description,
        explorationLevel: event.explorationLevel,
        youtubeUrl: event.youtubeUrl,
        previewImage: event.previewImage,
        isActive: !event.isActive,
      }),
    });
    const data = (await res.json()) as { event?: Event; error?: string };
    if (!res.ok || !data.event) {
      setError(data.error || "Status konnte nicht geändert werden");
      return;
    }
    setEvents((prev) =>
      prev.map((e) => (e.id === data.event!.id ? data.event! : e)).sort(byDate)
    );
    setMessage(
      data.event.isActive
        ? `„${data.event.title}" ist jetzt aktiv`
        : `„${data.event.title}" ist jetzt inaktiv`
    );
  }

  async function handleDelete(event: Event) {
    if (
      !window.confirm(
        `Event „${event.title}" (${event.date}) wirklich löschen?`
      )
    ) {
      return;
    }
    setError(null);
    const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error || "Löschen fehlgeschlagen");
      return;
    }
    setEvents((prev) => prev.filter((e) => e.id !== event.id));
    setMessage(`Event „${event.title}" gelöscht`);
  }

  function handleSaved(event: Event) {
    setEvents((prev) => {
      const exists = prev.some((e) => e.id === event.id);
      const next = exists
        ? prev.map((e) => (e.id === event.id ? event : e))
        : [...prev, event];
      return next.sort(byDate);
    });
    setMessage(editing ? "Event aktualisiert" : "Event angelegt");
    setEditing(null);
    setCreating(false);
  }

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
      >
        <Box>
          <Typography variant="h1" component="h1">
            Dashboard
          </Typography>
          <Typography color="text.secondary">
            Angemeldet als {username} · Änderungen sind sofort öffentlich sichtbar
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" color="inherit" onClick={handleLogout}>
            Abmelden
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setCreating(true);
              setEditing(null);
            }}
          >
            Neues Event
          </Button>
        </Stack>
      </Stack>

      {message && (
        <Alert severity="success" onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ overflow: "hidden" }}>
        <TableContainer sx={{ maxWidth: "100%" }}>
          <Table size="medium" aria-label="Events">
            <TableHead>
              <TableRow>
                <TableCell>Datum</TableCell>
                <TableCell>Titel</TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                  Stufe
                </TableCell>
                <TableCell>Aktiv</TableCell>
                <TableCell align="right">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography color="text.secondary" py={3} textAlign="center">
                      Noch keine Events – lege das erste Event an.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {events.map((event) => (
                <TableRow key={event.id} hover>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <Typography variant="body2" fontWeight={600}>
                      {isFinaleRangeDate(event.date)
                        ? "19.10. – 29.10."
                        : event.date}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDisplayDate(event.date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={600}>{event.title || "—"}</Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        maxWidth: 320,
                      }}
                    >
                      {event.description || "Keine Beschreibung"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" }, minWidth: 180 }}>
                    <ExplorationBadge
                      level={event.explorationLevel}
                      compact
                      showBar={false}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={event.isActive}
                      onChange={() => void toggleActive(event)}
                      inputProps={{ "aria-label": "Event aktiv" }}
                    />
                    <Chip
                      size="small"
                      label={event.isActive ? "Aktiv" : "Inaktiv"}
                      color={event.isActive ? "success" : "default"}
                      variant="outlined"
                      sx={{ ml: 0.5, display: { xs: "none", sm: "inline-flex" } }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Bearbeiten">
                      <IconButton
                        aria-label="Bearbeiten"
                        onClick={() => {
                          setEditing(event);
                          setCreating(false);
                        }}
                      >
                        <EditOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                    {event.youtubeUrl && (
                      <Tooltip title="YouTube öffnen">
                        <IconButton
                          aria-label="YouTube"
                          href={event.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          component="a"
                        >
                          <OpenInNewIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Löschen">
                      <IconButton
                        aria-label="Löschen"
                        color="error"
                        onClick={() => void handleDelete(event)}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <EventFormDialog
        open={creating || Boolean(editing)}
        initial={editing}
        existingDates={existingDates}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={handleSaved}
      />
    </Stack>
  );
}

function byDate(a: Event, b: Event): number {
  return a.date.localeCompare(b.date);
}
