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
    () => buildCalendarDays(getCalendarDates(calendarYear), events, calendarYear),
    [events, calendarYear]
  );
  const [selected, setSelected] = useState<CalendarDay | null>(null);

  return (
    <>
      <Stack spacing={1.5} mb={3}>
        <Typography variant="h1" component="h1">
          Monat der offenen Tür.
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          maxWidth={640}
          sx={{ whiteSpace: "pre-line" }}
        >
          {`Die einmalige WG-Verabschiedung
Vom 26.09.26 bis zum 18.10.26 erwarten euch zahlreiche Events um nochmal alle legendären Momente der Wg zu erleben.
Jeder ist jederzeit herzlich willkommen.`}
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
