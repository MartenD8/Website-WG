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
});

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Benutzername ist erforderlich").max(100),
  password: z.string().min(1, "Passwort ist erforderlich").max(200),
});

export type EventFormData = z.infer<typeof eventSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
