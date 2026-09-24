import { z } from 'zod';

/**
 * Philippine mobile number, normalised to +63 E.164.
 *
 * Accepts the shapes people actually type — 09171234567, +639171234567,
 * 0917 123 4567 — because rejecting them is a registration drop-off, not a
 * data quality win.
 */
export const phoneSchema = z
  .string()
  .trim()
  .transform((raw) => raw.replace(/[\s()-]/g, ''))
  .transform((digits) => {
    if (digits.startsWith('+63')) return digits.slice(3);
    if (digits.startsWith('63') && digits.length === 12) return digits.slice(2);
    if (digits.startsWith('0')) return digits.slice(1);
    return digits;
  })
  .refine((national) => /^9\d{9}$/.test(national), {
    message: 'Enter a Philippine mobile number, for example 0917 123 4567',
  })
  .transform((national) => `+63${national}`);

const optionalTrimmed = (max: number) =>
  z.preprocess((value) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  }, z.string().min(1).max(max).optional());

export const registerBody = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_.]+$/, 'Letters, numbers, underscore and dot only')
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8, 'Use at least 8 characters').max(200),
  firstName: z.string().trim().min(1).max(60),
  middleName: optionalTrimmed(60),
  lastName: z.string().trim().min(1).max(60),
  suffix: optionalTrimmed(10),
  municipalitySlug: z.string().trim().min(1),
  barangaySlug: z.string().trim().min(1),
  addressDetail: z.string().trim().min(1).max(200),
  phone: phoneSchema,
  email: z.string().trim().email().optional(),
});

export const loginBody = z.object({
  username: z.string().trim().min(1).transform((value) => value.toLowerCase()),
  password: z.string().min(1),
});
