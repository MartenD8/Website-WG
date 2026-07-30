"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { QuizSubmission } from "@/types";

export function AdminQuizOverview() {
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/quiz/results");
      const data = (await res.json()) as {
        submissions?: QuizSubmission[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "Quiz-Ergebnisse konnten nicht geladen werden");
        return;
      }
      setSubmissions(data.submissions ?? []);
    })();
  }, []);

  return (
    <>
      <Typography variant="h2" component="h2" gutterBottom>
        Das große WG-Quiz
      </Typography>
      <Typography color="text.secondary" mb={2}>
        Teilnehmer sortiert nach richtigen Antworten
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Paper elevation={2}>
        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell align="right">Richtige Antworten</TableCell>
                <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                  Abgegeben
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3}>
                    <Typography color="text.secondary" py={2} textAlign="center">
                      Noch keine Quiz-Teilnahmen.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {submissions.map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>{s.name}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    {s.correctCount} / {s.totalQuestions}
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                    {new Date(s.createdAt).toLocaleString("de-DE")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
}
