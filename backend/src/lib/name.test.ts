import { describe, expect, it } from 'vitest';
import { composeFullName, readNameParts } from './name.js';

describe('composeFullName', () => {
  it('is first then last', () => {
    expect(composeFullName({ firstName: 'Juan', lastName: 'Dela Cruz', suffix: null })).toBe(
      'Juan Dela Cruz',
    );
  });

  it('puts the suffix at the end', () => {
    expect(composeFullName({ firstName: 'Pedro', lastName: 'Reyes', suffix: 'Jr.' })).toBe(
      'Pedro Reyes Jr.',
    );
  });

  it('never leaves a trailing or doubled space', () => {
    expect(composeFullName({ firstName: 'Ana', lastName: 'Cruz', suffix: '' })).toBe('Ana Cruz');
    expect(composeFullName({ firstName: ' Ana ', lastName: ' Cruz ', suffix: '  ' })).toBe(
      'Ana Cruz',
    );
  });

  it('survives an empty last name rather than producing "Ana "', () => {
    expect(composeFullName({ firstName: 'Ana', lastName: '', suffix: null })).toBe('Ana');
  });
});

describe('readNameParts', () => {
  it('returns the stored parts when both exist', () => {
    expect(readNameParts({ firstName: 'Juan', lastName: 'Cruz', fullName: 'ignored' })).toEqual({
      firstName: 'Juan',
      lastName: 'Cruz',
    });
  });

  it('falls back to the whole name for an account made by the previous release', () => {
    expect(readNameParts({ firstName: null, lastName: null, fullName: 'Window Test' })).toEqual({
      firstName: 'Window Test',
      lastName: '',
    });
  });

  it('never returns null, even with nothing to go on', () => {
    expect(readNameParts({ firstName: null, lastName: null, fullName: null })).toEqual({
      firstName: '',
      lastName: '',
    });
  });
});
