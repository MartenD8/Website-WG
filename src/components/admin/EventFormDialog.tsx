"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import type { Event, ExplorationLevel } from "@/types";
import { EXPLORATION_LABELS } from "@/types";
import { getSelectableCalendarDates, getCalendarYear, formatDateOptionLabel } from "@/lib/calendar";
import {
  VIDEO_ACCEPT_ATTRIBUTE,
  formatFileSize,
  isAllowedVideoMimeType,
} from "@/lib/video";

/**
 * Errors without a JSON body come from the web server in front of the app,
 * so the status code is the only clue – name it instead of hiding it.
 */
function describeUploadFailure(status: number): string {
  if (status === 413) {
    return "Der Webserver hat die Datei als zu groß abgewiesen (413). In der Nginx-Konfiguration muss client_max_body_size erhöht werden.";
  }
  if (status === 401) {
    return "Sitzung abgelaufen – bitte neu anmelden und erneut versuchen";
  }
  if (status === 502 || status === 504) {
    return `Der Webserver hat die Verbindung zur Anwendung abgebrochen (${status})`;
  }
  if (status === 0) {
    return "Verbindung während des Uploads unterbrochen";
  }
  return `Upload fehlgeschlagen (HTTP ${status})`;
}

/**
 * Uploads the file as a raw body so the server can stream it to disk.
 * XHR is used instead of fetch because it reports upload progress.
 */
function uploadVideo(
  file: File,
  onProgress: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads/video");
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      let payload: { videoPath?: string; error?: string } = {};
      try {
        payload = JSON.parse(xhr.responseText) as typeof payload;
      } catch {
        // Non-JSON answers come from the reverse proxy, not from the app.
        payload = {};
      }
      if (xhr.status >= 200 && xhr.status < 300 && payload.videoPath) {
        resolve(payload.videoPath);
      } else {
        reject(new Error(payload.error || describeUploadFailure(xhr.status)));
      }
    };

    xhr.onerror = () => reject(new Error("Netzwerkfehler beim Upload"));
    xhr.onabort = () => reject(new Error("Upload abgebrochen"));

    xhr.send(file);
  });
}

export interface EventFormValues {
  date: string;
  title: string;
  description: string;
  explorationLevel: ExplorationLevel;
  videoPath: string | null;
  isActive: boolean;
  beerCounterEnabled: boolean;
}

interface EventFormDialogProps {
  open: boolean;
  initial?: Event | null;
  existingDates: string[];
  onClose: () => void;
  onSaved: (event: Event) => void;
}

function toValues(event?: Event | null): EventFormValues {
  return {
    date: event?.date ?? "",
    title: event?.title ?? "",
    description: event?.description ?? "",
    explorationLevel: (event?.explorationLevel ?? 1) as ExplorationLevel,
    videoPath: event?.videoPath ?? null,
    isActive: event?.isActive ?? true,
    beerCounterEnabled: event?.beerCounterEnabled ?? false,
  };
}

export function EventFormDialog({
  open,
  initial,
  existingDates,
  onClose,
  onSaved,
}: EventFormDialogProps) {
  const isEdit = Boolean(initial);
  const [values, setValues] = useState<EventFormValues>(toValues(initial));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadInfo, setUploadInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setValues(toValues(initial));
      setError(null);
      setUploadInfo(null);
      setUploadProgress(0);
    }
  }, [open, initial]);

  const calendarDates = getSelectableCalendarDates(getCalendarYear());
  const dateOptions = calendarDates.filter(
    (d) => d === values.date || !existingDates.includes(d)
  );

  /** Remove a freshly uploaded file that never made it into the database. */
  async function discardUnsavedVideo(videoPath: string | null): Promise<void> {
    if (!videoPath || videoPath === initial?.videoPath) return;
    try {
      await fetch("/api/uploads/video", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoPath }),
      });
    } catch {
      // Orphaned file is acceptable – never block the dialog on cleanup
    }
  }

  async function handleVideoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);

    if (!isAllowedVideoMimeType(file.type)) {
      setError("Nur MP4- und WebM-Videos sind erlaubt");
      return;
    }

    const replaced = values.videoPath;
    setUploading(true);
    setUploadProgress(0);
    setUploadInfo(`${file.name} · ${formatFileSize(file.size)}`);
    try {
      const videoPath = await uploadVideo(file, setUploadProgress);
      setValues((v) => ({ ...v, videoPath }));
      await discardUnsavedVideo(replaced);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Upload fehlgeschlagen"
      );
    } finally {
      setUploading(false);
      setUploadInfo(null);
    }
  }

  async function handleVideoRemove() {
    const current = values.videoPath;
    setValues((v) => ({ ...v, videoPath: null }));
    await discardUnsavedVideo(current);
  }

  async function handleCancel() {
    await discardUnsavedVideo(values.videoPath);
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      date: values.date,
      title: values.title,
      description: values.description,
      explorationLevel: values.explorationLevel,
      videoPath: values.videoPath,
      isActive: values.isActive,
      beerCounterEnabled: values.beerCounterEnabled,
    };

    try {
      const res = await fetch(
        isEdit && initial ? `/api/events/${initial.id}` : "/api/events",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = (await res.json()) as { event?: Event; error?: string };
      if (!res.ok || !data.event) {
        setError(data.error || "Speichern fehlgeschlagen");
        return;
      }
      onSaved(data.event);
      onClose();
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => void handleCancel()}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {isEdit ? "Event bearbeiten" : "Neues Event anlegen"}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={2.5}>
            {error && <Alert severity="error">{error}</Alert>}

            <FormControl fullWidth required>
              <InputLabel id="event-date-label">Datum</InputLabel>
              <Select
                labelId="event-date-label"
                label="Datum"
                value={values.date}
                onChange={(e) =>
                  setValues((v) => ({ ...v, date: e.target.value }))
                }
              >
                {dateOptions.map((d) => (
                  <MenuItem key={d} value={d}>
                    {formatDateOptionLabel(d)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Titel"
              required
              fullWidth
              value={values.title}
              onChange={(e) =>
                setValues((v) => ({ ...v, title: e.target.value }))
              }
              inputProps={{ maxLength: 200 }}
            />

            <TextField
              label="Beschreibung"
              fullWidth
              multiline
              minRows={4}
              value={values.description}
              onChange={(e) =>
                setValues((v) => ({ ...v, description: e.target.value }))
              }
              inputProps={{ maxLength: 5000 }}
            />

            <FormControl fullWidth>
              <InputLabel id="level-label">Explorationsstufe</InputLabel>
              <Select
                labelId="level-label"
                label="Explorationsstufe"
                value={values.explorationLevel}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    explorationLevel: Number(e.target.value) as ExplorationLevel,
                  }))
                }
              >
                {([1, 2, 3, 4, 5] as ExplorationLevel[]).map((level) => (
                  <MenuItem key={level} value={level}>
                    {EXPLORATION_LABELS[level]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Video
              </Typography>

              {values.videoPath ? (
                <Stack spacing={1.5}>
                  <Box
                    component="video"
                    src={values.videoPath}
                    controls
                    preload="metadata"
                    sx={{
                      width: "100%",
                      maxHeight: 260,
                      borderRadius: 2,
                      bgcolor: "common.black",
                    }}
                  />
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Button
                      variant="outlined"
                      startIcon={<UploadFileOutlinedIcon />}
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Video ersetzen
                    </Button>
                    <Button
                      variant="text"
                      color="error"
                      startIcon={<DeleteOutlineIcon />}
                      disabled={uploading}
                      onClick={() => void handleVideoRemove()}
                    >
                      Video entfernen
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={
                    uploading ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <UploadFileOutlinedIcon />
                    )
                  }
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? "Wird hochgeladen…" : "Video hochladen"}
                </Button>
              )}

              {uploading && (
                <Box sx={{ mt: 1.5 }}>
                  <LinearProgress
                    variant={
                      uploadProgress > 0 ? "determinate" : "indeterminate"
                    }
                    value={uploadProgress}
                    sx={{ height: 8, borderRadius: 999 }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.5, display: "block" }}
                  >
                    {uploadProgress}% hochgeladen
                    {uploadInfo ? ` · ${uploadInfo}` : ""}
                  </Typography>
                </Box>
              )}

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1, display: "block" }}
              >
                MP4 oder WebM, keine Größenbeschränkung. Große Dateien brauchen
                entsprechend lange – Fenster währenddessen offen lassen.
              </Typography>

              <input
                ref={fileInputRef}
                type="file"
                accept={VIDEO_ACCEPT_ATTRIBUTE}
                hidden
                onChange={(e) => void handleVideoChange(e)}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={values.isActive}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, isActive: e.target.checked }))
                  }
                />
              }
              label={
                <Typography>
                  Event aktiv
                  <Typography component="span" variant="body2" color="text.secondary" display="block">
                    Inaktive Events erscheinen nicht auf der öffentlichen Seite
                  </Typography>
                </Typography>
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={values.beerCounterEnabled}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      beerCounterEnabled: e.target.checked,
                    }))
                  }
                />
              }
              label={
                <Typography>
                  Bier-Zähler aktiv
                  <Typography component="span" variant="body2" color="text.secondary" display="block">
                    Besucher können in der Detailansicht Name und Bieranzahl eintragen
                  </Typography>
                </Typography>
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => void handleCancel()}
            color="inherit"
            disabled={saving || uploading}
          >
            Abbrechen
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving || uploading || !values.date}
          >
            {saving ? "Speichern…" : "Speichern"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
