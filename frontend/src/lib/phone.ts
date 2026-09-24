/**
 * Display a stored +63 number the way people write it down.
 *
 * The API stores E.164 — `+639179998888` — which is correct and unreadable.
 * Nobody checks their own number in that form, and "is that mine?" is the
 * only question this field has to answer.
 */
export function formatPhone(e164: string): string {
  const match = /^\+63(9\d{2})(\d{3})(\d{4})$/.exec(e164);
  if (match === null) return e164; // anything unexpected is shown as stored
  return `0${match[1]} ${match[2]} ${match[3]}`;
}
