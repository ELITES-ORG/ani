import 'dotenv/config';
import { z } from 'zod';

/**
 * Treats an empty or whitespace-only value as absent.
 *
 * A dashboard field someone cleared sends "", not nothing. Without this, an
 * intentionally blank optional variable fails validation.
 */
function blankIsAbsent<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    schema.optional(),
  );
}

/**
 * Environment is validated once, at boot. A missing or malformed variable
 * should crash the process immediately rather than surface as a confusing
 * runtime error three layers deep in a request handler.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  // Every secret here is pasted into a dashboard by hand, and a textarea makes
  // a trailing newline invisible. An untrimmed value fails far from its cause:
  // a stray newline in SESSION_SECRET is simply a different secret.
  DATABASE_URL: z
    .string()
    .trim()
    .url({ message: 'DATABASE_URL must be a valid postgres:// connection string' }),

  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  SESSION_SECRET: z.string().trim().min(32, 'SESSION_SECRET must be at least 32 characters'),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(30),

  // Optional on purpose. Requiring these means a deploy that forgets one exits
  // at boot and takes the whole API down — browsing, ordering, registration —
  // for a subsystem that only serves product photos. Missing config disables
  // image upload and leaves everything else working.
  //
  // `blankIsAbsent` matters more than it looks: a variable left empty in a
  // Render or Vercel dashboard arrives as "", which is present, so a bare
  // .optional() would reject it and crash the boot it was meant to protect.
  SUPABASE_URL: blankIsAbsent(
    z.string().trim().url('SUPABASE_URL must be the project URL, e.g. https://abc.supabase.co'),
  ),
  SUPABASE_SERVICE_ROLE_KEY: blankIsAbsent(z.string().trim().min(20)),
  SUPABASE_STORAGE_BUCKET: z.string().trim().default('produce'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  console.error(`Invalid environment configuration:\n${issues}\n`);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
