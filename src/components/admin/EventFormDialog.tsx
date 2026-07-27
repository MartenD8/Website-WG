"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import type { Event, ExplorationLevel } from "@/types";
import { EXPLORATION_LABELS } from "@/types";
import { getSelectableCalendarDates, getCalendarYear, formatDateOptionLabel } from "@/lib/calendar";

export interface EventFormValues {
  date: string;
  title: string;
  description: string;
  explorationLevel: ExplorationLevel;
  youtubeUrl: string;
  previewImage: string;
  isActive: boolean;
}

interface EventFormDialogProps {
  open: boolean;
  initial?: Event | null;
  existingDates: string[];
  onClose: () => void;
  onSaved: (event: Event) => void;
}

function toValues(event?: Event | null): EventFormValues {
  return {
    date: event?.date ?? "",
    title: event?.title ?? "",
    description: event?.description ?? "",
    explorationLevel: (event?.explorationLevel ?? 1) as ExplorationLevel,
    youtubeUrl: event?.youtubeUrl ?? "",
    previewImage: event?.previewImage ?? "",
    isActive: event?.isActive ?? true,
  };
}

export function EventFormDialog({
  open,
  initial,
  existingDates,
  onClose,
  onSaved,
}: EventFormDialogProps) {
  const isEdit = Boolean(initial);
  const [values, setValues] = useState<EventFormValues>(toValues(initial));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(toValues(initial));
      setError(null);
    }
  }, [open, initial]);

  const calendarDates = getSelectableCalendarDates(getCalendarYear());
  const dateOptions = calendarDates.filter(
    (d) => d === values.date || !existingDates.includes(d)
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      date: values.date,
      title: values.title,
      description: values.description,
      explorationLevel: values.explorationLevel,
      youtubeUrl: values.youtubeUrl.trim() || null,
      previewImage: values.previewImage.trim() || null,
      isActive: values.isActive,
    };

    try {
      const res = await fetch(
        isEdit && initial ? `/api/events/${initial.id}` : "/api/events",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = (await res.json()) as { event?: Event; error?: string };
      if (!res.ok || !data.event) {
        setError(data.error || "Speichern fehlgeschlagen");
        return;
      }
      onSaved(data.event);
      onClose();
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {isEdit ? "Event bearbeiten" : "Neues Event anlegen"}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={2.5}>
            {error && <Alert severity="error">{error}</Alert>}

            <FormControl fullWidth required>
              <InputLabel id="event-date-label">Datum</InputLabel>
              <Select
                labelId="event-date-label"
                label="Datum"
                value={values.date}
                onChange={(e) =>
                  setValues((v) => ({ ...v, date: e.target.value }))
                }
              >
                {dateOptions.map((d) => (
                  <MenuItem key={d} value={d}>
                    {formatDateOptionLabel(d)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Titel"
              required
              fullWidth
              value={values.title}
              onChange={(e) =>
                setValues((v) => ({ ...v, title: e.target.value }))
              }
              inputProps={{ maxLength: 200 }}
            />

            <TextField
              label="Beschreibung"
              fullWidth
              multiline
              minRows={4}
              value={values.description}
              onChange={(e) =>
                setValues((v) => ({ ...v, description: e.target.value }))
              }
              inputProps={{ maxLength: 5000 }}
            />

            <FormControl fullWidth>
              <InputLabel id="level-label">Explorationsstufe</InputLabel>
              <Select
                labelId="level-label"
                label="Explorationsstufe"
                value={values.explorationLevel}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    explorationLevel: Number(e.target.value) as ExplorationLevel,
                  }))
                }
              >
                {([1, 2, 3, 4, 5] as ExplorationLevel[]).map((level) => (
                  <MenuItem key={level} value={level}>
                    {EXPLORATION_LABELS[level]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="YouTube-Link"
              fullWidth
              placeholder="https://www.youtube.com/watch?v=…"
              value={values.youtubeUrl}
              onChange={(e) =>
                setValues((v) => ({ ...v, youtubeUrl: e.target.value }))
              }
            />

            <TextField
              label="Vorschaubild-URL (optional)"
              fullWidth
              helperText="Leer lassen, um das YouTube-Thumbnail zu nutzen"
              value={values.previewImage}
              onChange={(e) =>
                setValues((v) => ({ ...v, previewImage: e.target.value }))
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={values.isActive}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, isActive: e.target.checked }))
                  }
                />
              }
              label={
                <Typography>
                  Event aktiv
                  <Typography component="span" variant="body2" color="text.secondary" display="block">
                    Inaktive Events erscheinen nicht auf der öffentlichen Seite
                  </Typography>
                </Typography>
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={saving}>
            Abbrechen
          </Button>
          <Button type="submit" variant="contained" disabled={saving || !values.date}>
            {saving ? "Speichern…" : "Speichern"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
