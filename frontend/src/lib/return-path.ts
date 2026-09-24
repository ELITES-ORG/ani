/**
 * Where to send someone after they sign in.
 *
 * An unvalidated `next` is an open redirect: a link to
 * `/login?next=https://evil.example` would bounce them to an attacker's page
 * the moment they typed their password. Only in-app paths are allowed.
 */
export function readReturnPath(search: string): string {
  const next = new URLSearchParams(search).get('next');
  if (next === null) return '/';

  // A single leading slash, never a protocol-relative URL, never a scheme.
  if (!next.startsWith('/') || next.startsWith('//') || next.includes(':')) {
    return '/';
  }

  return next;
}
