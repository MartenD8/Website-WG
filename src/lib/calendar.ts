import {
  eachDayOfInterval,
  format,
  parseISO,
  isValid,
  startOfDay,
} from "date-fns";
import { de } from "date-fns/locale";
import type { Event } from "@/types";
import {
  CALENDAR_START,
  CALENDAR_END,
  CALENDAR_FINALE_START,
  CALENDAR_FINALE_END,
} from "@/types";

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

/** ISO date used to store the finale range event (19.10.) */
export function getFinaleRangeDate(year = getCalendarYear()): string {
  return format(
    new Date(year, CALENDAR_FINALE_START.month - 1, CALENDAR_FINALE_START.day),
    "yyyy-MM-dd"
  );
}

export function isFinaleRangeDate(isoDate: string): boolean {
  return /^\d{4}-10-19$/.test(isoDate);
}

/** Daily tiles: 26.09. through 18.10. inclusive */
export function getCalendarDates(year = getCalendarYear()): string[] {
  const { start, end } = getCalendarBounds(year);
  return eachDayOfInterval({ start, end }).map((d) => format(d, "yyyy-MM-dd"));
}

/** All selectable dates including the finale range tile (19.10.–29.10.) */
export function getSelectableCalendarDates(year = getCalendarYear()): string[] {
  return [...getCalendarDates(year), getFinaleRangeDate(year)];
}

export function formatDisplayDate(isoDate: string): string {
  if (isFinaleRangeDate(isoDate)) {
    return formatFinaleRangeLabel(isoDate);
  }
  const date = parseISO(isoDate);
  if (!isValid(date)) return isoDate;
  return format(date, "EEEE, d. MMMM yyyy", { locale: de });
}

export function formatFinaleRangeLabel(isoDate?: string): string {
  const year = isoDate
    ? parseISO(isoDate).getFullYear()
    : getCalendarYear();
  const start = new Date(
    year,
    CALENDAR_FINALE_START.month - 1,
    CALENDAR_FINALE_START.day
  );
  const end = new Date(
    year,
    CALENDAR_FINALE_END.month - 1,
    CALENDAR_FINALE_END.day
  );
  return `${format(start, "d. MMMM", { locale: de })} – ${format(end, "d. MMMM yyyy", { locale: de })}`;
}

export function formatShortDate(isoDate: string): string {
  if (isFinaleRangeDate(isoDate)) {
    return "19.–29. Okt";
  }
  const date = parseISO(isoDate);
  if (!isValid(date)) return isoDate;
  return format(date, "d. MMM", { locale: de });
}

export function formatDayNumber(isoDate: string): string {
  if (isFinaleRangeDate(isoDate)) {
    return "19–29";
  }
  const date = parseISO(isoDate);
  if (!isValid(date)) return "";
  return format(date, "d");
}

export function formatMonthLabel(isoDate: string): string {
  if (isFinaleRangeDate(isoDate)) {
    return "Okt";
  }
  const date = parseISO(isoDate);
  if (!isValid(date)) return "";
  return format(date, "MMM", { locale: de });
}

export function formatWeekday(isoDate: string): string {
  if (isFinaleRangeDate(isoDate)) {
    return "Zeitraum";
  }
  const date = parseISO(isoDate);
  if (!isValid(date)) return "";
  return format(date, "EEE", { locale: de });
}

export function formatDateOptionLabel(isoDate: string): string {
  if (isFinaleRangeDate(isoDate)) {
    return `19.10. – 29.10. ${getCalendarYear()} (Abschluss-Zeitraum)`;
  }
  return isoDate;
}

export interface CalendarDay {
  date: string;
  event: Event | null;
  hasEvent: boolean;
  /** True for the extra tile covering 19.10.–29.10. */
  isRange?: boolean;
}

export function buildCalendarDays(
  dates: string[],
  events: Event[],
  year = getCalendarYear()
): CalendarDay[] {
  const byDate = new Map(events.map((e) => [e.date, e]));
  const days = dates.map((date) => {
    const event = byDate.get(date) ?? null;
    return {
      date,
      event,
      hasEvent: Boolean(event && event.isActive && event.title.trim()),
      isRange: false,
    };
  });

  const finaleDate = getFinaleRangeDate(year);
  const finaleEvent = byDate.get(finaleDate) ?? null;
  days.push({
    date: finaleDate,
    event: finaleEvent,
    hasEvent: Boolean(
      finaleEvent && finaleEvent.isActive && finaleEvent.title.trim()
    ),
    isRange: true,
  });

  return days;
}
