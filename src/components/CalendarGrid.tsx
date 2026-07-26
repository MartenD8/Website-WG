"use client";

import { useMemo, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import type { Event } from "@/types";
import {
  buildCalendarDays,
  getCalendarDates,
  getCalendarYear,
  type CalendarDay,
} from "@/lib/calendar";
import { EventCard } from "@/components/EventCard";
import { EventDialog } from "@/components/EventDialog";

interface CalendarGridProps {
  events: Event[];
  year?: number;
}

export function CalendarGrid({ events, year }: CalendarGridProps) {
  const calendarYear = year ?? getCalendarYear();
  const days = useMemo(
    () => buildCalendarDays(getCalendarDates(calendarYear), events),
    [events, calendarYear]
  );
  const [selected, setSelected] = useState<CalendarDay | null>(null);

  return (
    <>
      <Stack spacing={1} mb={3}>
        <Typography variant="h1" component="h1">
          Event-Kalender
        </Typography>
        <Typography variant="body1" color="text.secondary" maxWidth={560}>
          Vom 25. September bis 18. Oktober {calendarYear} – entdecke täglich
          ein Event und öffne das zugehörige YouTube-Video.
        </Typography>
      </Stack>

      <Grid container spacing={2}>
        {days.map((day, index) => (
          <Grid key={day.date} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Box sx={{ height: "100%" }}>
              <EventCard
                day={day}
                index={index}
                onClick={() => setSelected(day)}
              />
            </Box>
          </Grid>
        ))}
      </Grid>

      <EventDialog
        day={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
