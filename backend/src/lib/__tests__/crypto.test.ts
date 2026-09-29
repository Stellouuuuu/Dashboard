import { describe, it, expect, beforeEach } from 'vitest';
import { encrypt, decrypt } from '../crypto.js';

// La fonction key() utilise env.CRYPTO_KEY, on doit le définir AVANT d'importer crypto
// On le fait via process.env avant l'import (vitest charge les modules une fois)
// Voir le fichier vitest.config.ts : env est injecté dans setup
describe('crypto.ts', () => {
  describe('encrypt() / decrypt()', () => {
    it('encrypt retourne une string non vide au format iv:tag:data', () => {
      const result = encrypt('hello world');
      expect(result).toBeTypeOf('string');
      const parts = result.split(':');
      expect(parts).toHaveLength(3);
      expect(parts[0]).toMatch(/^[0-9a-f]+$/); // iv hex
      expect(parts[1]).toMatch(/^[0-9a-f]+$/); // authTag hex
      expect(parts[2]).toMatch(/^[0-9a-f]+$/); // data hex
    });

    it('decrypt retourne le texte original', () => {
      const plain = 'mon_token_oauth_secret';
      const encrypted = encrypt(plain);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plain);
    });

    it('encrypt est non-déterministe : deux chiffrements du même texte diffèrent (IV aléatoire)', () => {
      const e1 = encrypt('same_text');
      const e2 = encrypt('same_text');
      expect(e1).not.toBe(e2);
    });

    it('les deux résultats se déchiffrent quand même vers le même texte clair', () => {
      const plain = 'same_text';
      const e1 = encrypt(plain);
      const e2 = encrypt(plain);
      expect(decrypt(e1)).toBe(plain);
      expect(decrypt(e2)).toBe(plain);
    });

    it('decrypt lève une erreur sur un payload invalide', () => {
      expect(() => decrypt('invalide')).toThrow();
    });

    it('decrypt lève une erreur si le payload est altéré', () => {
      const encrypted = encrypt('data sensible');
      const parts = encrypted.split(':');
      // Altérer les données chiffrées
      parts[2] = '0'.repeat(parts[2].length);
      expect(() => decrypt(parts.join(':'))).toThrow();
    });

    it('encrypt fonctionne avec des chaînes vides', () => {
      const result = encrypt('');
      expect(decrypt(result)).toBe('');
    });

    it('encrypt fonctionne avec des caractères spéciaux et unicode', () => {
      const text = 'ghp_àéîô漢字🔑 token=abc&secret=xyz';
      expect(decrypt(encrypt(text))).toBe(text);
    });
  });
});
