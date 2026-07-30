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
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { AwardDefinition } from "@/data/awards";

interface AwardsDialogProps {
  open: boolean;
  onClose: () => void;
}

type Step = "name" | "vote" | "done";

export function AwardsDialog({ open, onClose }: AwardsDialogProps) {
  const [step, setStep] = useState<Step>("name");
  const [voterName, setVoterName] = useState("");
  const [awards, setAwards] = useState<AwardDefinition[]>([]);
  const [nominations, setNominations] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep("name");
    setVoterName("");
    setNominations({});
    setError(null);
    void fetch("/api/awards")
      .then((r) => r.json())
      .then((data: { awards?: AwardDefinition[] }) => {
        setAwards(data.awards ?? []);
      })
      .catch(() => setError("Awards konnten nicht geladen werden"));
  }, [open]);

  function startVote(e: FormEvent) {
    e.preventDefault();
    if (!voterName.trim()) {
      setError("Bitte Namen eingeben");
      return;
    }
    setError(null);
    setStep("vote");
  }

  async function submitVotes(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/awards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voterName: voterName.trim(),
          nominations,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Speichern fehlgeschlagen");
        return;
      }
      setStep("done");
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="body">
      <DialogTitle sx={{ pr: 6 }}>
        Awards
        <IconButton
          aria-label="Schließen"
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {step === "name" && (
          <Box component="form" onSubmit={startVote}>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Typography color="text.secondary">
                Gib zuerst deinen Namen ein – analog zum Bier-Check-in.
              </Typography>
              <TextField
                label="Dein Name"
                required
                fullWidth
                autoFocus
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                inputProps={{ maxLength: 40 }}
              />
              <Button type="submit" variant="contained">
                Weiter zu den Awards
              </Button>
            </Stack>
          </Box>
        )}

        {step === "vote" && (
          <Box component="form" onSubmit={submitVotes}>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Abstimmender: <strong>{voterName}</strong>
              </Typography>
              <Alert severity="info">
                <strong>
                  Bitte gib die Personen mit ihrem vollständigen und korrekten
                  Namen an. Nur so können die Stimmen eindeutig zugeordnet
                  werden.
                </strong>
              </Alert>
              {awards.map((award) => (
                <Box
                  key={award.id}
                  sx={{ p: 2, borderRadius: 3, bgcolor: "action.hover" }}
                >
                  <Typography fontWeight={700} mb={1}>
                    {award.title}
                  </Typography>
                  <TextField
                    label="Nominierte Person"
                    fullWidth
                    size="small"
                    value={nominations[award.id] ?? ""}
                    onChange={(e) =>
                      setNominations((prev) => ({
                        ...prev,
                        [award.id]: e.target.value,
                      }))
                    }
                    inputProps={{ maxLength: 60 }}
                  />
                </Box>
              ))}
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? "Speichern…" : "Awards absenden"}
              </Button>
            </Stack>
          </Box>
        )}

        {step === "done" && (
          <Alert severity="success" sx={{ mt: 1 }}>
            Danke, {voterName}! Deine Award-Stimmen wurden gespeichert.
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Schließen
        </Button>
      </DialogActions>
    </Dialog>
  );
}
