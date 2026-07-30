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
import RefreshIcon from "@mui/icons-material/Refresh";
import type { QuizSubmission } from "@/types";
import { QUIZ_QUESTIONS } from "@/data/quiz";

function formatAnswer(
  questionId: number,
  value: string | Record<string, string> | undefined
): string {
  if (value == null) return "—";
  if (typeof value === "string") return value || "—";
  const q = QUIZ_QUESTIONS.find((item) => item.id === questionId);
  if (!q || q.type !== "matching") {
    return Object.entries(value)
      .map(([k, v]) => `${k}:${v}`)
      .join(", ");
  }
  return q.matchingItems
    .map((item) => `${item.label}=${value[item.id] || "?"}`)
    .join(" · ");
}

export function AdminQuizOverview() {
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [nameDrafts, setNameDrafts] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/quiz/results");
    const data = (await res.json()) as {
      submissions?: QuizSubmission[];
      error?: string;
    };
    if (!res.ok) {
      setError(data.error || "Quiz-Ergebnisse konnten nicht geladen werden");
      return;
    }
    const list = data.submissions ?? [];
    setSubmissions(list);
    const drafts: Record<number, string> = {};
    for (const s of list) drafts[s.id] = s.name;
    setNameDrafts(drafts);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function recalculate(id: number) {
    setError(null);
    const submission = submissions.find((s) => s.id === id);
    if (!submission) return;
    const res = await fetch(`/api/quiz/results/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nameDrafts[id] ?? submission.name,
        answers: submission.answers,
        recalculate: true,
      }),
    });
    const data = (await res.json()) as {
      submission?: QuizSubmission;
      error?: string;
    };
    if (!res.ok || !data.submission) {
      setError(data.error || "Neuberechnung fehlgeschlagen");
      return;
    }
    setMessage(
      `Ergebnis neu berechnet: ${data.submission.correctCount}/${data.submission.totalQuestions}`
    );
    await load();
  }

  async function saveName(id: number) {
    setError(null);
    const res = await fetch(`/api/quiz/results/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameDrafts[id] }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error || "Speichern fehlgeschlagen");
      return;
    }
    setMessage("Teilnehmer aktualisiert");
    await load();
  }

  async function removeSubmission(id: number) {
    if (!window.confirm("Gesamten Quiz-Versuch wirklich löschen?")) return;
    setError(null);
    const res = await fetch(`/api/quiz/results/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error || "Löschen fehlgeschlagen");
      return;
    }
    setMessage("Versuch gelöscht");
    await load();
  }

  return (
    <Box>
      <Typography variant="h2" component="h2" gutterBottom>
        Das große WG-Quiz
      </Typography>
      <Typography color="text.secondary" mb={2}>
        Teilnehmer, Antworten einsehen, neu berechnen oder Versuch löschen
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
      {submissions.length === 0 && (
        <Typography color="text.secondary">Noch keine Quiz-Teilnahmen.</Typography>
      )}
      {submissions.map((s) => (
        <Accordion key={s.id} disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={700}>
              {s.name}{" "}
              <Typography component="span" color="text.secondary">
                ({s.correctCount}/{s.totalQuestions} richtig)
              </Typography>
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  label="Name"
                  size="small"
                  value={nameDrafts[s.id] ?? s.name}
                  onChange={(e) =>
                    setNameDrafts((prev) => ({ ...prev, [s.id]: e.target.value }))
                  }
                />
                <Button variant="outlined" onClick={() => void saveName(s.id)}>
                  Name speichern
                </Button>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={() => void recalculate(s.id)}
                >
                  Neu berechnen
                </Button>
                <IconButton
                  color="error"
                  aria-label="Versuch löschen"
                  onClick={() => void removeSubmission(s.id)}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </Stack>

              <Typography variant="caption" color="text.secondary">
                Abgegeben: {new Date(s.createdAt).toLocaleString("de-DE")}
              </Typography>

              <Stack spacing={1}>
                {QUIZ_QUESTIONS.map((q) => (
                  <Box
                    key={q.id}
                    sx={{ p: 1.5, borderRadius: 2, bgcolor: "action.hover" }}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      {q.id}. {q.question}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Antwort: {formatAnswer(q.id, s.answers[String(q.id)])}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
