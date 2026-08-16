"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import Image from "next/image";
import { Box, ButtonBase, Typography, alpha } from "@mui/material";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";

interface EventVideoPlayerProps {
  src: string;
  poster?: string | null;
  title: string;
}

/**
 * Shows the preview image first and swaps in a native player on click.
 * Without a preview image the player is rendered right away.
 */
export function EventVideoPlayer({
  src,
  poster,
  title,
}: EventVideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const showPoster = Boolean(poster) && !playing;

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
        aspectRatio: "16 / 9",
        borderRadius: 3,
        overflow: "hidden",
        bgcolor: "common.black",
      }}
    >
      {showPoster ? (
        <ButtonBase
          onClick={() => setPlaying(true)}
          aria-label={`Video abspielen: ${title}`}
          sx={{ position: "absolute", inset: 0, display: "block" }}
        >
          <Image
            src={poster as string}
            alt={`Vorschau: ${title}`}
            fill
            sizes="(max-width: 600px) 100vw, 560px"
            style={{ objectFit: "cover" }}
            unoptimized={(poster as string).startsWith("/")}
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
      ) : (
        <Box
          component="video"
          ref={videoRef}
          src={src}
          poster={poster ?? undefined}
          controls
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          onContextMenu={(event: MouseEvent<HTMLVideoElement>) =>
            event.preventDefault()
          }
          autoPlay={playing}
          playsInline
          preload="metadata"
          sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />
      )}
    </Box>
  );
}
