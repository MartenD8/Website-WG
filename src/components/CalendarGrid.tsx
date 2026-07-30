"use client";

import { useMemo, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import type { BeerStats, Event } from "@/types";
import {
  buildCalendarDays,
  getCalendarDates,
  getCalendarYear,
  type CalendarDay,
} from "@/lib/calendar";
import { EventCard } from "@/components/EventCard";
import { EventDialog } from "@/components/EventDialog";
import { BeerCounterBanner } from "@/components/BeerCounterBanner";
import { QuizDialog } from "@/components/QuizDialog";
import { AwardsDialog } from "@/components/AwardsDialog";

interface CalendarGridProps {
  events: Event[];
  year?: number;
  initialBeerStats: BeerStats;
}

export function CalendarGrid({
  events,
  year,
  initialBeerStats,
}: CalendarGridProps) {
  const calendarYear = year ?? getCalendarYear();
  const days = useMemo(
    () =>
      buildCalendarDays(getCalendarDates(calendarYear), events, calendarYear),
    [events, calendarYear]
  );
  const [selected, setSelected] = useState<CalendarDay | null>(null);
  const [beerStats, setBeerStats] = useState<BeerStats>(initialBeerStats);
  const [quizOpen, setQuizOpen] = useState(false);
  const [awardsOpen, setAwardsOpen] = useState(false);

  return (
    <>
      <Stack spacing={1.5} mb={3}>
        <BeerCounterBanner stats={beerStats} />
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

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} pt={0.5}>
          <Button
            variant="contained"
            startIcon={<QuizOutlinedIcon />}
            onClick={() => setQuizOpen(true)}
          >
            Das große WG-Quiz
          </Button>
          <Button
            variant="outlined"
            startIcon={<EmojiEventsOutlinedIcon />}
            onClick={() => setAwardsOpen(true)}
          >
            Awards
          </Button>
        </Stack>
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
        onBeerSubmitted={setBeerStats}
      />
      <QuizDialog open={quizOpen} onClose={() => setQuizOpen(false)} />
      <AwardsDialog open={awardsOpen} onClose={() => setAwardsOpen(false)} />
    </>
  );
}
