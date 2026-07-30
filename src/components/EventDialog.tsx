"use client";

import Image from "next/image";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import type { CalendarDay } from "@/lib/calendar";
import { formatDisplayDate, youtubeThumbnail } from "@/lib/calendar";
import { ExplorationBadge } from "@/components/ExplorationBadge";
import { BeerCheckInForm } from "@/components/BeerCheckInForm";
import { EventRsvpForm } from "@/components/EventRsvpForm";
import type { BeerStats, ExplorationLevel } from "@/types";

interface EventDialogProps {
  day: CalendarDay | null;
  open: boolean;
  onClose: () => void;
  onBeerSubmitted?: (stats: BeerStats) => void;
}

export function EventDialog({
  day,
  open,
  onClose,
  onBeerSubmitted,
}: EventDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const event = day?.event;
  const hasEvent = Boolean(day?.hasEvent && event);
  const thumb =
    event?.previewImage || youtubeThumbnail(event?.youtubeUrl) || null;
  const showBeerForm = Boolean(
    hasEvent && event?.beerCounterEnabled && event?.id
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      scroll="body"
      TransitionProps={{ timeout: 280 }}
      aria-labelledby="event-dialog-title"
    >
      <DialogTitle
        id="event-dialog-title"
        sx={{
          pr: 6,
          pb: 1,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)}, transparent)`,
        }}
      >
        <Typography variant="overline" color="text.secondary" fontWeight={700}>
          Eventdetails
        </Typography>
        <Typography variant="h2" component="h2" sx={{ mt: 0.5 }}>
          {hasEvent && event ? event.title : "Kein Event"}
        </Typography>
        <IconButton
          aria-label="Schließen"
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers={false} sx={{ pt: 2 }}>
        {day && (
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <CalendarMonthOutlinedIcon color="primary" fontSize="small" />
              <Typography variant="body1" fontWeight={600}>
                {formatDisplayDate(day.date)}
              </Typography>
            </Stack>

            {hasEvent && event ? (
              <>
                {thumb && (
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "16 / 9",
                      borderRadius: 3,
                      overflow: "hidden",
                      bgcolor: "action.hover",
                    }}
                  >
                    <Image
                      src={thumb}
                      alt={`Vorschau: ${event.title}`}
                      fill
                      sizes="(max-width: 600px) 100vw, 560px"
                      style={{ objectFit: "cover" }}
                      unoptimized={thumb.startsWith("/")}
                    />
                  </Box>
                )}

                <Box>
                  <Typography
                    variant="h4"
                    component="h3"
                    gutterBottom
                    color="primary"
                  >
                    Über dieses Event
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ whiteSpace: "pre-wrap" }}
                  >
                    {event.description?.trim() ||
                      "Keine Beschreibung verfügbar."}
                  </Typography>
                </Box>

                <ExplorationBadge
                  level={event.explorationLevel as ExplorationLevel}
                />

                <EventRsvpForm eventId={event.id} />

                {showBeerForm && (
                  <BeerCheckInForm
                    eventId={event.id}
                    onSubmitted={onBeerSubmitted}
                  />
                )}
              </>
            ) : (
              <Typography color="text.secondary">
                An diesem Tag ist kein Event hinterlegt. Schau an einem anderen
                Kalendertag vorbei.
              </Typography>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} color="inherit">
          Schließen
        </Button>
        {hasEvent && event?.youtubeUrl && (
          <Button
            variant="contained"
            color="primary"
            endIcon={<OpenInNewIcon />}
            href={event.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            YouTube öffnen
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
