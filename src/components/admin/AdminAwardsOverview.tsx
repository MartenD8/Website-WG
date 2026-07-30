"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { AwardResult } from "@/types";

export function AdminAwardsOverview() {
  const [results, setResults] = useState<AwardResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/awards/results");
      const data = (await res.json()) as {
        results?: AwardResult[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "Award-Ergebnisse konnten nicht geladen werden");
        return;
      }
      setResults(data.results ?? []);
    })();
  }, []);

  return (
    <Box>
      <Typography variant="h2" component="h2" gutterBottom>
        Awards-Übersicht
      </Typography>
      <Typography color="text.secondary" mb={2}>
        Top 3 je Award nach Stimmen
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Stack spacing={2}>
        {results.map((result) => (
          <Paper key={result.awardId} elevation={2} sx={{ p: 2.5 }}>
            <Typography fontWeight={700} mb={1.5}>
              {result.awardTitle}
            </Typography>
            {result.top.length === 0 ? (
              <Typography color="text.secondary" variant="body2">
                Noch keine Stimmen
              </Typography>
            ) : (
              <Stack direction="row" flexWrap="wrap" gap={1} useFlexGap>
                {result.top.map((row, index) => (
                  <Chip
                    key={`${result.awardId}-${row.name}`}
                    color={index === 0 ? "primary" : "default"}
                    variant={index === 0 ? "filled" : "outlined"}
                    label={`${index + 1}. ${row.name} (${row.votes})`}
                  />
                ))}
              </Stack>
            )}
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}
