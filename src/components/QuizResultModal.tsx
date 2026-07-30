"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import { getQuizResultTier } from "@/data/quiz";

interface QuizResultModalProps {
  open: boolean;
  name: string;
  correctCount: number;
  totalQuestions: number;
  onClose: () => void;
}

export function QuizResultModal({
  open,
  name,
  correctCount,
  totalQuestions,
  onClose,
}: QuizResultModalProps) {
  const tier = getQuizResultTier(correctCount);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
          border: `2px solid ${alpha(tier.accent, 0.45)}`,
        },
      }}
    >
      <Box
        sx={{
          py: 3,
          px: 2,
          textAlign: "center",
          background: `linear-gradient(160deg, ${alpha(tier.accent, 0.28)}, ${alpha(tier.accent, 0.06)})`,
        }}
      >
        <Typography sx={{ fontSize: "3.5rem", lineHeight: 1 }}>{tier.emoji}</Typography>
      </Box>
      <DialogContent>
        <Stack spacing={2} textAlign="center" pt={1}>
          <Typography variant="overline" color="text.secondary" fontWeight={700}>
            Ergebnis für {name}
          </Typography>
          <Typography variant="h3" component="h2" sx={{ color: tier.accent }}>
            {tier.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {tier.body}
          </Typography>
          <Typography variant="h4" fontWeight={700}>
            Du hast {correctCount} von {totalQuestions} Fragen richtig
            beantwortet.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
        <Button variant="contained" onClick={onClose} sx={{ minWidth: 140 }}>
          Schließen
        </Button>
      </DialogActions>
    </Dialog>
  );
}
