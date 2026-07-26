import { Box, Container, Typography } from "@mui/material";
import { SiteHeader } from "@/components/SiteHeader";
import { CalendarGrid } from "@/components/CalendarGrid";
import { getActiveEvents } from "@/lib/db";
import { getCalendarYear } from "@/lib/calendar";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const events = getActiveEvents();
  const year = getCalendarYear();

  return (
    <Box component="main" sx={{ minHeight: "100vh", pb: 8 }}>
      <SiteHeader />
      <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 5 } }}>
        <CalendarGrid events={events} year={year} />
      </Container>
      <Box
        component="footer"
        sx={{
          mt: 8,
          py: 3,
          textAlign: "center",
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Event Kalender · {year} · Präsentationsplattform
        </Typography>
      </Box>
    </Box>
  );
}
