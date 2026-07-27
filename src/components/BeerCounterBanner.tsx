"use client";

import { Stack, Typography, Box } from "@mui/material";
import type { BeerStats } from "@/types";

interface BeerCounterBannerProps {
  stats: BeerStats;
}

export function BeerCounterBanner({ stats }: BeerCounterBannerProps) {
  const topLabel =
    stats.topDrinker && stats.topDrinkerBeers > 0
      ? ` (${stats.topDrinker})`
      : "";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { xs: "flex-start", md: "baseline" },
        justifyContent: "space-between",
        gap: { xs: 2, md: 3 },
        width: "100%",
      }}
    >
      <Typography variant="h1" component="h1" sx={{ flexShrink: 0 }}>
        Monat der offenen Tür.
      </Typography>

      <Stack
        direction="row"
        alignItems="baseline"
        spacing={1}
        flexWrap="wrap"
        useFlexGap
        sx={{
          flex: 1,
          justifyContent: { xs: "flex-start", md: "center" },
          maxWidth: { md: 520 },
          mx: { md: "auto" },
        }}
      >
        <Typography
          variant="body1"
          component="span"
          fontWeight={600}
          color="text.secondary"
        >
          Anzahl vergenussverferkelter Bier:
        </Typography>
        <Typography
          variant="h2"
          component="span"
          color="primary"
          sx={{ fontWeight: 700, lineHeight: 1 }}
        >
          {stats.totalBeers}
          <Typography
            component="span"
            variant="h4"
            color="text.secondary"
            sx={{ fontWeight: 600, ml: 0.5 }}
          >
            {topLabel}
          </Typography>
        </Typography>
      </Stack>
    </Box>
  );
}
