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
import LocalBarOutlinedIcon from "@mui/icons-material/LocalBarOutlined";
import type { BeerStats } from "@/types";

interface BeerCheckInFormProps {
  eventId: number;
  onSubmitted?: (stats: BeerStats) => void;
}

export function BeerCheckInForm({ eventId, onSubmitted }: BeerCheckInFormProps) {
  const [name, setName] = useState("");
  const [beers, setBeers] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName("");
    setBeers("1");
    setError(null);
    setSuccess(null);
  }, [eventId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/beers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          name,
          beers: Number(beers),
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        stats?: BeerStats;
      };
      if (!res.ok) {
        setError(data.error || "Speichern fehlgeschlagen");
        return;
      }
      setSuccess("Eintrag gespeichert – Prost!");
      setBeers("1");
      if (data.stats) onSubmitted?.(data.stats);
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
          <LocalBarOutlinedIcon color="primary" fontSize="small" />
          <Typography variant="h4" component="h3">
            Bier-Check-in
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Trag ein, wie viele Bier du an diesem Tag getrunken hast – und deinen
          Namen für die Rangliste.
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
        <TextField
          label="Anzahl Bier"
          type="number"
          required
          fullWidth
          value={beers}
          onChange={(e) => setBeers(e.target.value)}
          inputProps={{ min: 1, max: 50, step: 1 }}
        />
        <Button type="submit" variant="contained" disabled={saving}>
          {saving ? "Speichern…" : "Eintragen"}
        </Button>
      </Stack>
    </Box>
  );
}
