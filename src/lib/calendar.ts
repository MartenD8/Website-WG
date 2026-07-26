import {
  eachDayOfInterval,
  format,
  parseISO,
  isValid,
  startOfDay,
} from "date-fns";
import { de } from "date-fns/locale";
import type { Event } from "@/types";
import { CALENDAR_START, CALENDAR_END } from "@/types";

/** Resolve calendar year: prefer public env or current year */
export function getCalendarYear(): number {
  const fromEnv = Number(
    process.env.NEXT_PUBLIC_CALENDAR_YEAR || process.env.CALENDAR_YEAR
  );
  if (fromEnv && fromEnv >= 2020 && fromEnv <= 2100) return fromEnv;
  return new Date().getFullYear();
}

export function getCalendarBounds(year = getCalendarYear()): {
  start: Date;
  end: Date;
} {
  const start = startOfDay(
    new Date(year, CALENDAR_START.month - 1, CALENDAR_START.day)
  );
  const end = startOfDay(
    new Date(year, CALENDAR_END.month - 1, CALENDAR_END.day)
  );
  return { start, end };
}

/** All calendar days from 25.09. through 18.10. inclusive */
export function getCalendarDates(year = getCalendarYear()): string[] {
  const { start, end } = getCalendarBounds(year);
  return eachDayOfInterval({ start, end }).map((d) => format(d, "yyyy-MM-dd"));
}

export function formatDisplayDate(isoDate: string): string {
  const date = parseISO(isoDate);
  if (!isValid(date)) return isoDate;
  return format(date, "EEEE, d. MMMM yyyy", { locale: de });
}

export function formatShortDate(isoDate: string): string {
  const date = parseISO(isoDate);
  if (!isValid(date)) return isoDate;
  return format(date, "d. MMM", { locale: de });
}

export function formatDayNumber(isoDate: string): string {
  const date = parseISO(isoDate);
  if (!isValid(date)) return "";
  return format(date, "d");
}

export function formatMonthLabel(isoDate: string): string {
  const date = parseISO(isoDate);
  if (!isValid(date)) return "";
  return format(date, "MMM", { locale: de });
}

export function formatWeekday(isoDate: string): string {
  const date = parseISO(isoDate);
  if (!isValid(date)) return "";
  return format(date, "EEE", { locale: de });
}

export interface CalendarDay {
  date: string;
  event: Event | null;
  hasEvent: boolean;
}

export function buildCalendarDays(
  dates: string[],
  events: Event[]
): CalendarDay[] {
  const byDate = new Map(events.map((e) => [e.date, e]));
  return dates.map((date) => {
    const event = byDate.get(date) ?? null;
    return {
      date,
      event,
      hasEvent: Boolean(event && event.isActive && event.title.trim()),
    };
  });
}

/** Extract YouTube video ID for thumbnail / validation */
export function extractYoutubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.slice(1).split("/")[0] || null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/");
      const embedIdx = parts.indexOf("embed");
      if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1];
      const shortsIdx = parts.indexOf("shorts");
      if (shortsIdx >= 0 && parts[shortsIdx + 1]) return parts[shortsIdx + 1];
    }
  } catch {
    return null;
  }
  return null;
}

export function youtubeThumbnail(
  url: string | null | undefined
): string | null {
  const id = extractYoutubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}
