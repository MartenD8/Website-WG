"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent, SyntheticEvent } from "react";
import { Box, ButtonBase, Typography, alpha } from "@mui/material";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";

interface EventVideoPlayerProps {
  src: string;
  title: string;
}

/** Keeps portrait videos from filling the whole dialog. */
const MAX_HEIGHT = 520;

/**
 * Shows a still frame of the video first and swaps in a native player on click.
 *
 * The still frame is the video itself: the media fragment `#t=0.1` makes the
 * browser decode and paint the frame at that position, which spares us stored
 * thumbnails. Both elements share one URL, so the second one reads from cache.
 */
export function EventVideoPlayer({ src, title }: EventVideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Phone recordings are often portrait, so the frame follows the video
  // instead of squeezing it into a fixed landscape box.
  function readAspectRatio(event: SyntheticEvent<HTMLVideoElement>): void {
    const { videoWidth, videoHeight } = event.currentTarget;
    if (videoWidth > 0 && videoHeight > 0) {
      setAspectRatio(videoWidth / videoHeight);
    }
  }

  // The autoPlay attribute is unreliable for elements mounted after load,
  // so playback is requested explicitly. Blocked autoplay just shows controls.
  useEffect(() => {
    if (!playing) return;
    void videoRef.current?.play().catch(() => undefined);
  }, [playing, src]);

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: aspectRatio ?? 16 / 9,
        // Height cap plus matching width cap: portrait videos stay tall
        // without leaving black bars beside them.
        maxHeight: MAX_HEIGHT,
        maxWidth: aspectRatio ? MAX_HEIGHT * aspectRatio : "100%",
        alignSelf: "center",
        borderRadius: 3,
        overflow: "hidden",
        bgcolor: "common.black",
      }}
    >
      {playing ? (
        <Box
          component="video"
          ref={videoRef}
          src={src}
          controls
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          onContextMenu={(event: MouseEvent<HTMLVideoElement>) =>
            event.preventDefault()
          }
          autoPlay
          playsInline
          preload="metadata"
          onLoadedMetadata={readAspectRatio}
          sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />
      ) : (
        <ButtonBase
          onClick={() => setPlaying(true)}
          aria-label={`Video abspielen: ${title}`}
          sx={{ position: "absolute", inset: 0, display: "block" }}
        >
          <Box
            component="video"
            src={`${src}#t=0.1`}
            muted
            playsInline
            preload="metadata"
            onLoadedMetadata={readAspectRatio}
            aria-hidden
            tabIndex={-1}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              pointerEvents: "none",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.5,
              background: (t) =>
                `linear-gradient(180deg, ${alpha(t.palette.common.black, 0.1)}, ${alpha(t.palette.common.black, 0.45)})`,
              transition: "background 0.2s ease",
              "&:hover": {
                background: (t) => alpha(t.palette.common.black, 0.35),
              },
            }}
          >
            <Box
              sx={{
                width: 68,
                height: 68,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                bgcolor: (t) => alpha(t.palette.common.white, 0.92),
                color: "primary.main",
                boxShadow: 4,
              }}
            >
              <PlayArrowRoundedIcon sx={{ fontSize: 44 }} />
            </Box>
            <Typography
              variant="body2"
              sx={{ color: "common.white", fontWeight: 700 }}
            >
              Video abspielen
            </Typography>
          </Box>
        </ButtonBase>
      )}
    </Box>
  );
}
