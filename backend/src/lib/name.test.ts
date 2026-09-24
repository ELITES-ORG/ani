import { describe, expect, it } from 'vitest';
import { composeFullName } from './name.js';

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

