import { describe, it, expect } from 'vitest';
import { generateToken, generateOtpCode, hashToken } from '../token.js';

describe('token.ts', () => {
  describe('generateToken()', () => {
    it('génère un token de 64 caractères hexadécimaux', () => {
      const token = generateToken();
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it('génère deux tokens différents à chaque appel', () => {
      const t1 = generateToken();
      const t2 = generateToken();
      expect(t1).not.toBe(t2);
    });
  });

  describe('generateOtpCode()', () => {
    it('génère un code de 6 chiffres', () => {
      const code = generateOtpCode();
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^\d{6}$/);
    });

    it('est padé avec des zéros si nécessaire', () => {
      // On ne peut pas forcer randomInt, mais on vérifie toujours 6 chiffres
      for (let i = 0; i < 20; i++) {
        const code = generateOtpCode();
        expect(code).toHaveLength(6);
      }
    });

    it('génère un nombre dans [000000, 999999]', () => {
      const code = generateOtpCode();
      const num = parseInt(code, 10);
      expect(num).toBeGreaterThanOrEqual(0);
      expect(num).toBeLessThanOrEqual(999999);
    });
  });

  describe('hashToken()', () => {
    it('retourne un hash sha256 de 64 caractères hex', () => {
      const hash = hashToken('mytoken');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('est déterministe : même input → même hash', () => {
      const h1 = hashToken('abc123');
      const h2 = hashToken('abc123');
      expect(h1).toBe(h2);
    });

    it('deux inputs différents → deux hashes différents', () => {
      const h1 = hashToken('token_a');
      const h2 = hashToken('token_b');
      expect(h1).not.toBe(h2);
    });
  });
});
