/**
 * How a name is said out loud here: first last, then the suffix if any.
 * Middle name is kept on the account but left out of the spoken form.
 */
export function composeFullName(parts: {
  firstName: string;
  lastName: string;
  suffix: string | null;
}): string {
  return [parts.firstName, parts.lastName, parts.suffix]
    .map((part) => part?.trim() ?? '')
    .filter((part) => part !== '')
    .join(' ');
}

/**
 * The name parts for a stored account, during the expand phase of plan 0006.
 *
 * An account created by the previous release in the few minutes between the
 * expand migration and this code going live has full_name and no parts. The
 * contract migration backfills those; until then they read as if the whole
 * name were the first name, rather than crashing /me for that person.
 *
 * Deleted in the contract step, when first_name and last_name become NOT NULL.
 */
export function readNameParts(row: {
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
}): { firstName: string; lastName: string } {
  if (row.firstName !== null && row.lastName !== null) {
    return { firstName: row.firstName, lastName: row.lastName };
  }
  return { firstName: row.firstName ?? row.fullName?.trim() ?? '', lastName: row.lastName ?? '' };
}
