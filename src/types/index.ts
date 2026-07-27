/** Exploration level (1–5) for events */
export type ExplorationLevel = 1 | 2 | 3 | 4 | 5;

export interface Event {
  id: number;
  /** ISO date string YYYY-MM-DD */
  date: string;
  title: string;
  description: string;
  explorationLevel: ExplorationLevel;
  youtubeUrl: string | null;
  previewImage: string | null;
  isActive: boolean;
  /** When true, visitors can submit beer counts for this day */
  beerCounterEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventInput {
  date: string;
  title: string;
  description: string;
  explorationLevel: ExplorationLevel;
  youtubeUrl?: string | null;
  previewImage?: string | null;
  isActive?: boolean;
  beerCounterEnabled?: boolean;
}

export interface BeerEntry {
  id: number;
  eventId: number;
  date: string;
  name: string;
  beers: number;
  createdAt: string;
}

export interface BeerStats {
  totalBeers: number;
  topDrinker: string | null;
  topDrinkerBeers: number;
}

export interface AdminUser {
  id: number;
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface SessionPayload {
  sub: string;
  username: string;
  iat: number;
  exp: number;
}

export interface ApiError {
  error: string;
  details?: unknown;
}

/** Calendar range: 26 Sep – 18 Oct (inclusive) */
export const CALENDAR_START = { month: 9, day: 26 } as const;
export const CALENDAR_END = { month: 10, day: 18 } as const;

/** Extra tile after the last day: 19 Oct – 29 Oct (stored as start date) */
export const CALENDAR_FINALE_START = { month: 10, day: 19 } as const;
export const CALENDAR_FINALE_END = { month: 10, day: 29 } as const;

export const EXPLORATION_LABELS: Record<ExplorationLevel, string> = {
  1: "Level 1 – Gemütlich",
  2: "Level 2 – Ausgelassen",
  3: "Level 3 – Vollgas",
  4: "Level 4 – Eskalation",
  5: "Level 5 – Legendär",
};
