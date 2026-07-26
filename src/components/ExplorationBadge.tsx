"use client";

import {
  Box,
  Chip,
  LinearProgress,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import type { ExplorationLevel } from "@/types";
import { EXPLORATION_LABELS } from "@/types";
import { LEVEL_COLORS } from "@/theme/theme";

interface ExplorationBadgeProps {
  level: ExplorationLevel;
  compact?: boolean;
  showBar?: boolean;
}

export function ExplorationBadge({
  level,
  compact = false,
  showBar = true,
}: ExplorationBadgeProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const color = isDark ? LEVEL_COLORS[level].dark : LEVEL_COLORS[level].light;
  const progress = (level / 5) * 100;

  if (compact) {
    return (
      <Chip
        size="small"
        icon={<ExploreOutlinedIcon sx={{ fontSize: 16 }} />}
        label={`Level ${level}`}
        sx={{
          bgcolor: `${color}22`,
          color,
          border: `1px solid ${color}55`,
          "& .MuiChip-icon": { color },
          fontWeight: 700,
        }}
      />
    );
  }

  return (
    <Stack spacing={1} sx={{ width: "100%" }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <ExploreOutlinedIcon sx={{ color, fontSize: 20 }} />
        <Typography variant="body2" fontWeight={700} sx={{ color }}>
          {EXPLORATION_LABELS[level]}
        </Typography>
      </Stack>
      {showBar && (
        <Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 999,
              bgcolor: `${color}22`,
              "& .MuiLinearProgress-bar": {
                borderRadius: 999,
                bgcolor: color,
              },
            }}
          />
          <Stack direction="row" justifyContent="space-between" mt={0.5}>
            <Typography variant="caption" color="text.secondary">
              Stufe {level} von 5
            </Typography>
            <Typography variant="caption" fontWeight={600} sx={{ color }}>
              {Math.round(progress)}%
            </Typography>
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
