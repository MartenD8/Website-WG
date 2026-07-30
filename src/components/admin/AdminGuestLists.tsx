"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import type { EventGuestList } from "@/types";
import { formatDisplayDate, isFinaleRangeDate } from "@/lib/calendar";

export function AdminGuestLists() {
  const [lists, setLists] = useState<EventGuestList[]>([]);
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/rsvp/overview?sort=${sort}`);
    const data = (await res.json()) as {
      lists?: EventGuestList[];
      error?: string;
    };
    if (!res.ok) {
      setError(data.error || "Gästelisten konnten nicht geladen werden");
      return;
    }
    setLists(data.lists ?? []);
  }, [sort]);

  useEffect(() => {
    void load();
  }, [load]);

  async function removeGuest(id: number) {
    if (!window.confirm("Gast wirklich von der Liste entfernen?")) return;
    setError(null);
    const res = await fetch(`/api/rsvp/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error || "Löschen fehlgeschlagen");
      return;
    }
    setMessage("Gast entfernt");
    await load();
  }

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
        mb={2}
      >
        <Box>
          <Typography variant="h2" component="h2" gutterBottom>
            Gästelisten
          </Typography>
          <Typography color="text.secondary">
            Anmeldungen je Event – Gäste können gelöscht werden
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="rsvp-sort-label">Sortierung</InputLabel>
          <Select
            labelId="rsvp-sort-label"
            label="Sortierung"
            value={sort}
            onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
          >
            <MenuItem value="newest">Neueste zuerst</MenuItem>
            <MenuItem value="oldest">Älteste zuerst</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {message && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {lists.map((list) => (
        <Accordion key={list.eventId} disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={700}>
              {list.eventTitle || "Ohne Titel"}{" "}
              <Typography component="span" color="text.secondary">
                (
                {isFinaleRangeDate(list.date)
                  ? "19.10. – 29.10."
                  : formatDisplayDate(list.date)}
                {" · "}
                {list.guests.length}{" "}
                {list.guests.length === 1 ? "Gast" : "Gäste"})
              </Typography>
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {list.guests.length === 0 ? (
              <Typography color="text.secondary">Noch keine Anmeldungen.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Anmeldung</TableCell>
                    <TableCell align="right">Aktion</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.guests.map((guest) => (
                    <TableRow key={guest.id} hover>
                      <TableCell>
                        <Typography fontWeight={600}>{guest.name}</Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(guest.createdAt).toLocaleString("de-DE")}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="error"
                          aria-label="Gast löschen"
                          onClick={() => void removeGuest(guest.id)}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
