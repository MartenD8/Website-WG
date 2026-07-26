"use client";

import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import type { CalendarDay } from "@/lib/calendar";
import {
  formatDayNumber,
  formatMonthLabel,
  formatWeekday,
} from "@/lib/calendar";
import { ExplorationBadge } from "@/components/ExplorationBadge";
import type { ExplorationLevel } from "@/types";

interface EventCardProps {
  day: CalendarDay;
  onClick: () => void;
  index: number;
}

export function EventCard({ day, onClick, index }: EventCardProps) {
  const theme = useTheme();
  const { date, event, hasEvent } = day;
  const preview =
    event?.description?.trim().slice(0, 90) ||
    (hasEvent ? "Mehr erfahren …" : "Kein Event an diesem Tag");

  return (
    <Card
      elevation={2}
      sx={{
        height: "100%",
        opacity: hasEvent ? 1 : 0.72,
        animation: `fadeRise 0.45s ease both`,
        animationDelay: `${Math.min(index, 20) * 30}ms`,
        "@keyframes fadeRise": {
          from: { opacity: 0, transform: "translateY(12px)" },
          to: { opacity: hasEvent ? 1 : 0.72, transform: "translateY(0)" },
        },
        "&:hover": {
          transform: "scale(1.025)",
          boxShadow: theme.shadows[4],
          zIndex: 1,
        },
      }}
    >
      <CardActionArea
        onClick={onClick}
        sx={{
          height: "100%",
          alignItems: "stretch",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
          "& .MuiCardActionArea-focusHighlight": {
            background: alpha(theme.palette.primary.main, 0.12),
          },
        }}
      >
        <Box
          sx={{
            px: 2,
            pt: 2,
            pb: 1,
            background: hasEvent
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.16)}, ${alpha(theme.palette.secondary.main, 0.08)})`
              : alpha(theme.palette.text.primary, 0.04),
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}
              >
                {formatWeekday(date)}
              </Typography>
              <Typography variant="h3" component="p" sx={{ lineHeight: 1, mt: 0.25 }}>
                {formatDayNumber(date)}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                {formatMonthLabel(date)}
              </Typography>
            </Box>
            {!hasEvent && (
              <EventBusyOutlinedIcon color="disabled" fontSize="small" />
            )}
          </Stack>
        </Box>

        <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1.25 }}>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: "2.6em",
            }}
          >
            {hasEvent && event ? event.title : "Frei"}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              flex: 1,
            }}
          >
            {preview}
            {hasEvent && event && event.description.length > 90 ? "…" : ""}
          </Typography>

          {hasEvent && event ? (
            <ExplorationBadge
              level={event.explorationLevel as ExplorationLevel}
              compact
              showBar={false}
            />
          ) : (
            <ChipEmpty />
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function ChipEmpty() {
  return (
    <Typography
      variant="caption"
      sx={{
        display: "inline-flex",
        alignSelf: "flex-start",
        px: 1,
        py: 0.35,
        borderRadius: 1,
        bgcolor: (t) => alpha(t.palette.text.primary, 0.06),
        color: "text.secondary",
        fontWeight: 600,
      }}
    >
      Kein Event
    </Typography>
  );
}
