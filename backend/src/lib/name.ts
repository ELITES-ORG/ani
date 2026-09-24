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

