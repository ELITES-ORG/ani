/**
 * Where to send someone after they sign in.
 *
 * An unvalidated `next` is an open redirect: a link to
 * `/login?next=https://evil.example` would bounce them to an attacker's page
 * the moment they typed their password. Only in-app paths are allowed.
 */

/**
 * Tab, newline, carriage return and friends.
 *
 * These are not cosmetic. The URL parser *strips* them before resolving, so
 * `/<TAB>/evil.com` becomes `//evil.com` — protocol-relative, and off-site —
 * while sailing past a check that only looks for a leading `//`. Reject them
 * outright rather than trying to reason about what the parser will do next.
 */
// Matching control characters is the entire point of this expression.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

export function readReturnPath(search: string): string {
  const next = new URLSearchParams(search).get('next');
  if (next === null) return '/';

  if (CONTROL_CHARACTERS.test(next)) return '/';

  // A backslash is a path separator to the URL parser for http(s) URLs, so
  // `/\evil.com` can resolve off-site exactly as `//evil.com` would.
  if (next.includes('\\')) return '/';

  // A single leading slash, never a protocol-relative URL, never a scheme.
  if (!next.startsWith('/') || next.startsWith('//') || next.includes(':')) {
    return '/';
  }

  return next;
}
