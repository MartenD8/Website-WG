"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import type { BeerPersonOverview } from "@/types";

export function AdminBeerOverview() {
  const [people, setPeople] = useState<BeerPersonOverview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Record<number, { name: string; beers: string }>
  >({});

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/beers/overview");
    const data = (await res.json()) as {
      people?: BeerPersonOverview[];
      error?: string;
    };
    if (!res.ok) {
      setError(data.error || "Bier-Übersicht konnte nicht geladen werden");
      return;
    }
    const list = data.people ?? [];
    setPeople(list);
    const next: Record<number, { name: string; beers: string }> = {};
    for (const person of list) {
      for (const entry of person.entries) {
        next[entry.id] = {
          name: entry.name,
          beers: String(entry.beers),
        };
      }
    }
    setDrafts(next);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveEntry(id: number) {
    const draft = drafts[id];
    if (!draft) return;
    setError(null);
    const res = await fetch(`/api/beers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name,
        beers: Number(draft.beers),
      }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error || "Speichern fehlgeschlagen");
      return;
    }
    setMessage("Bier-Eintrag aktualisiert");
    await load();
  }

  async function removeEntry(id: number) {
    if (!window.confirm("Eintrag wirklich löschen?")) return;
    setError(null);
    const res = await fetch(`/api/beers/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error || "Löschen fehlgeschlagen");
      return;
    }
    setMessage("Eintrag gelöscht");
    await load();
  }

  return (
    <Box>
      <Typography variant="h2" component="h2" gutterBottom>
        Biercounter-Übersicht
      </Typography>
      <Typography color="text.secondary" mb={2}>
        Personen absteigend nach Gesamtanzahl – aufklappen zum Bearbeiten
      </Typography>
      {message && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {people.length === 0 && (
        <Typography color="text.secondary">Noch keine Bier-Einträge.</Typography>
      )}
      {people.map((person) => (
        <Accordion key={person.name} disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={700}>
              {person.name}{" "}
              <Typography component="span" color="text.secondary">
                ({person.totalBeers} Bier)
              </Typography>
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              {person.entries.map((entry) => (
                <Stack
                  key={entry.id}
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ sm: "center" }}
                  sx={{ p: 1.5, borderRadius: 2, bgcolor: "action.hover" }}
                >
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight={600}>
                      {entry.eventTitle}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {entry.date}
                    </Typography>
                  </Box>
                  <TextField
                    label="Name"
                    size="small"
                    value={drafts[entry.id]?.name ?? entry.name}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [entry.id]: {
                          name: e.target.value,
                          beers: prev[entry.id]?.beers ?? String(entry.beers),
                        },
                      }))
                    }
                  />
                  <TextField
                    label="Bier"
                    size="small"
                    type="number"
                    sx={{ width: 100 }}
                    value={drafts[entry.id]?.beers ?? String(entry.beers)}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [entry.id]: {
                          name: prev[entry.id]?.name ?? entry.name,
                          beers: e.target.value,
                        },
                      }))
                    }
                    inputProps={{ min: 1, max: 50 }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => void saveEntry(entry.id)}
                  >
                    Speichern
                  </Button>
                  <IconButton
                    color="error"
                    aria-label="Löschen"
                    onClick={() => void removeEntry(entry.id)}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
