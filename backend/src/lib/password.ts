import { hash, verify } from '@node-rs/argon2';

/**
 * Argon2id with the defaults from @node-rs/argon2.
 *
 * Deliberately not bcrypt: bcrypt silently truncates at 72 bytes, which turns
 * a long passphrase into a shorter one without telling anybody.
 */
export function hashPassword(plain: string): Promise<string> {
  return hash(plain);
}

export async function verifyPassword(digest: string, plain: string): Promise<boolean> {
  try {
    return await verify(digest, plain);
  } catch {
    // A malformed digest in the database is a failed login, not a 500.
    return false;
  }
}
