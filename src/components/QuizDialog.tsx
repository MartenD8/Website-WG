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
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { PublicQuizQuestion } from "@/data/quiz";

interface QuizDialogProps {
  open: boolean;
  onClose: () => void;
}

type Step = "name" | "quiz" | "done";

export function QuizDialog({ open, onClose }: QuizDialogProps) {
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [questions, setQuestions] = useState<PublicQuizQuestion[]>([]);
  const [answers, setAnswers] = useState<
    Record<string, string | Record<string, string>>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    correctCount: number;
    totalQuestions: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep("name");
    setName("");
    setAnswers({});
    setError(null);
    setResult(null);
    void fetch("/api/quiz")
      .then((r) => r.json())
      .then((data: { questions?: PublicQuizQuestion[] }) => {
        setQuestions(data.questions ?? []);
      })
      .catch(() => setError("Quiz konnte nicht geladen werden"));
  }, [open]);

  function startQuiz(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Bitte Namen eingeben");
      return;
    }
    setError(null);
    setStep("quiz");
  }

  async function submitQuiz(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), answers }),
      });
      const data = (await res.json()) as {
        error?: string;
        submission?: { correctCount: number; totalQuestions: number };
      };
      if (!res.ok || !data.submission) {
        setError(data.error || "Speichern fehlgeschlagen");
        return;
      }
      setResult({
        correctCount: data.submission.correctCount,
        totalQuestions: data.submission.totalQuestions,
      });
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
        Das große WG-Quiz
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
          <Box component="form" onSubmit={startQuiz}>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Typography color="text.secondary">
                Gib zuerst deinen Namen ein – analog zum Bier-Check-in.
              </Typography>
              <TextField
                label="Dein Name"
                required
                fullWidth
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                inputProps={{ maxLength: 40 }}
              />
              <Button type="submit" variant="contained">
                Quiz starten
              </Button>
            </Stack>
          </Box>
        )}

        {step === "quiz" && (
          <Box component="form" onSubmit={submitQuiz}>
            <Stack spacing={3} sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Teilnehmer: <strong>{name}</strong>
              </Typography>
              {questions.map((q) => (
                <Box
                  key={q.id}
                  sx={{ p: 2, borderRadius: 3, bgcolor: "action.hover" }}
                >
                  <Typography fontWeight={700} mb={1.5}>
                    {q.id}. {q.question}
                  </Typography>
                  {q.type === "single" ? (
                    <FormControl>
                      <RadioGroup
                        value={(answers[String(q.id)] as string) || ""}
                        onChange={(e) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [String(q.id)]: e.target.value,
                          }))
                        }
                      >
                        {(["A", "B", "C", "D"] as const).map((key) => (
                          <FormControlLabel
                            key={key}
                            value={key}
                            control={<Radio />}
                            label={`${key}: ${q.options[key]}`}
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                  ) : (
                    <Stack spacing={1.5}>
                      <Typography variant="body2" color="text.secondary">
                        {q.hint}
                      </Typography>
                      <Typography variant="body2">
                        Optionen:{" "}
                        {(["A", "B", "C", "D"] as const)
                          .map((k) => `${k}=${q.matchingOptions[k]}`)
                          .join(" · ")}
                      </Typography>
                      {q.matchingItems.map((item) => (
                        <TextField
                          key={item.id}
                          label={`${item.label} (A–D)`}
                          size="small"
                          value={
                            (
                              (answers[String(q.id)] as
                                | Record<string, string>
                                | undefined) ?? {}
                            )[item.id] ?? ""
                          }
                          onChange={(e) =>
                            setAnswers((prev) => ({
                              ...prev,
                              [String(q.id)]: {
                                ...((prev[String(q.id)] as
                                  | Record<string, string>
                                  | undefined) ?? {}),
                                [item.id]: e.target.value
                                  .trim()
                                  .toUpperCase()
                                  .slice(0, 1),
                              },
                            }))
                          }
                          inputProps={{ maxLength: 1 }}
                        />
                      ))}
                    </Stack>
                  )}
                </Box>
              ))}
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? "Speichern…" : "Quiz absenden"}
              </Button>
            </Stack>
          </Box>
        )}

        {step === "done" && result && (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="success">
              Danke, {name}! Deine Antworten wurden gespeichert.
            </Alert>
            <Typography variant="h4">
              Ergebnis: {result.correctCount} von {result.totalQuestions} richtig
            </Typography>
          </Stack>
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
