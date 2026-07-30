import { z } from "zod";

const optionalUrl = z
  .union([z.string().url(), z.literal(""), z.null()])
  .optional()
  .transform((v) => (v === "" || v === undefined ? null : v));

export const eventSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Datum muss im Format YYYY-MM-DD sein"),
  title: z
    .string()
    .trim()
    .min(1, "Titel ist erforderlich")
    .max(200, "Titel darf maximal 200 Zeichen haben"),
  description: z
    .string()
    .trim()
    .max(5000, "Beschreibung darf maximal 5000 Zeichen haben")
    .default(""),
  explorationLevel: z.coerce
    .number()
    .int()
    .min(1)
    .max(5) as z.ZodType<1 | 2 | 3 | 4 | 5>,
  youtubeUrl: optionalUrl.refine(
    (url) =>
      url === null ||
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(url),
    { message: "Nur YouTube-URLs sind erlaubt" }
  ),
  previewImage: optionalUrl,
  isActive: z.boolean().optional().default(true),
  beerCounterEnabled: z.boolean().optional().default(false),
});

export const beerEntrySchema = z.object({
  eventId: z.coerce.number().int().positive(),
  name: z
    .string()
    .trim()
    .min(1, "Name ist erforderlich")
    .max(40, "Name darf maximal 40 Zeichen haben"),
  beers: z.coerce
    .number()
    .int("Nur ganze Zahlen")
    .min(1, "Mindestens 1 Bier")
    .max(50, "Maximal 50 Bier pro Eintrag"),
});

export const beerEntryUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name ist erforderlich")
    .max(40, "Name darf maximal 40 Zeichen haben")
    .optional(),
  beers: z.coerce
    .number()
    .int("Nur ganze Zahlen")
    .min(1, "Mindestens 1 Bier")
    .max(50, "Maximal 50 Bier pro Eintrag")
    .optional(),
});

export const quizSubmitSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name ist erforderlich")
    .max(40, "Name darf maximal 40 Zeichen haben"),
  answers: z.record(
    z.string(),
    z.union([z.string(), z.record(z.string(), z.string())])
  ),
});

export const awardSubmitSchema = z.object({
  voterName: z
    .string()
    .trim()
    .min(1, "Name ist erforderlich")
    .max(40, "Name darf maximal 40 Zeichen haben"),
  nominations: z.record(z.string(), z.string()),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Benutzername ist erforderlich").max(100),
  password: z.string().min(1, "Passwort ist erforderlich").max(200),
});

export type EventFormData = z.infer<typeof eventSchema>;
export type BeerEntryFormData = z.infer<typeof beerEntrySchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
