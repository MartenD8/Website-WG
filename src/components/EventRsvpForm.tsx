"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";

interface EventRsvpFormProps {
  eventId: number;
}

export function EventRsvpForm({ eventId }: EventRsvpFormProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName("");
    setError(null);
    setSuccess(null);
  }, [eventId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, name: name.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Anmeldung fehlgeschlagen");
        return;
      }
      setSuccess(`Angemeldet als ${name.trim()} – bis dann!`);
      setName("");
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: 2,
        borderRadius: 3,
        bgcolor: "action.hover",
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <HowToRegOutlinedIcon color="primary" fontSize="small" />
          <Typography variant="h4" component="h3">
            Zum Event anmelden
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Trag deinen Namen ein, um dich für dieses Event anzumelden.
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <TextField
          label="Dein Name"
          required
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          inputProps={{ maxLength: 40 }}
        />
        <Button type="submit" variant="contained" disabled={saving || !name.trim()}>
          {saving ? "Anmelden…" : "Anmelden"}
        </Button>
      </Stack>
    </Box>
  );
}
