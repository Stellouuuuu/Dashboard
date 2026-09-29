import { describe, it, expect } from 'vitest';
import { CONSTANTS } from '../../config/constants.js';

describe('config/constants.ts', () => {
  it('REFRESH_RATE_MIN est 30 secondes', () => {
    expect(CONSTANTS.REFRESH_RATE_MIN).toBe(30);
  });

  it('REFRESH_RATE_DEFAULT est supérieur ou égal à REFRESH_RATE_MIN', () => {
    expect(CONSTANTS.REFRESH_RATE_DEFAULT).toBeGreaterThanOrEqual(CONSTANTS.REFRESH_RATE_MIN);
  });

  it('REFRESH_RATE_DEFAULT est 60 secondes', () => {
    expect(CONSTANTS.REFRESH_RATE_DEFAULT).toBe(60);
  });
});
