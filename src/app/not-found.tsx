import Link from "next/link";
import { Box, Button, Typography } from "@mui/material";

export const metadata = {
  title: "Nicht gefunden",
};

export default function NotFound() {
  return (
    <Box
      component="main"
      sx={{
        minHeight: "70vh",
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        px: 2,
      }}
    >
      <Box>
        <Typography variant="h1" component="h1" gutterBottom>
          404
        </Typography>
        <Typography color="text.secondary" mb={3}>
          Seite nicht gefunden
        </Typography>
        <Button component={Link} href="/" variant="contained">
          Zur Startseite
        </Button>
      </Box>
    </Box>
  );
}
