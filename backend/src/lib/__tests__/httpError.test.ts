import { describe, it, expect } from 'vitest';
import { HttpError, httpError, ERROR_CODES } from '../httpError.js';

describe('httpError.ts', () => {
  describe('HttpError class', () => {
    it('crée une instance de Error', () => {
      const err = new HttpError(404, 'AUTH_USER_NOT_FOUND');
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(HttpError);
    });

    it('expose le status HTTP', () => {
      const err = new HttpError(403, 'AUTH_FORBIDDEN');
      expect(err.status).toBe(403);
    });

    it('expose le code stable', () => {
      const err = new HttpError(401, 'AUTH_UNAUTHENTICATED');
      expect(err.code).toBe('AUTH_UNAUTHENTICATED');
    });

    it('utilise le code comme message par défaut', () => {
      const err = new HttpError(500, 'INTERNAL_ERROR');
      expect(err.message).toBe('INTERNAL_ERROR');
    });

    it('utilise le message personnalisé quand fourni', () => {
      const err = new HttpError(400, 'VALIDATION_ERROR', 'Champ manquant');
      expect(err.message).toBe('Champ manquant');
    });
  });

  describe('httpError() factory', () => {
    it('retourne une instance de HttpError', () => {
      const err = httpError(400, 'VALIDATION_ERROR');
      expect(err).toBeInstanceOf(HttpError);
    });

    it('crée une erreur 409 pour email déjà pris', () => {
      const err = httpError(409, 'AUTH_EMAIL_TAKEN', 'Un compte existe déjà');
      expect(err.status).toBe(409);
      expect(err.code).toBe('AUTH_EMAIL_TAKEN');
      expect(err.message).toBe('Un compte existe déjà');
    });

    it('crée une erreur 401 pour identifiants invalides', () => {
      const err = httpError(401, 'AUTH_INVALID_CREDENTIALS');
      expect(err.status).toBe(401);
      expect(err.code).toBe('AUTH_INVALID_CREDENTIALS');
    });

    it('crée une erreur 502 pour fetch échoué', () => {
      const err = httpError(502, 'DASHBOARD_FETCH_FAILED', 'API externe indisponible');
      expect(err.status).toBe(502);
      expect(err.code).toBe('DASHBOARD_FETCH_FAILED');
    });
  });

  describe('ERROR_CODES', () => {
    it('contient les codes d\'authentification essentiels', () => {
      expect(ERROR_CODES.AUTH_EMAIL_TAKEN).toBe('AUTH_EMAIL_TAKEN');
      expect(ERROR_CODES.AUTH_INVALID_CREDENTIALS).toBe('AUTH_INVALID_CREDENTIALS');
      expect(ERROR_CODES.AUTH_EMAIL_NOT_CONFIRMED).toBe('AUTH_EMAIL_NOT_CONFIRMED');
      expect(ERROR_CODES.AUTH_ACCOUNT_SUSPENDED).toBe('AUTH_ACCOUNT_SUSPENDED');
      expect(ERROR_CODES.AUTH_SESSION_EXPIRED).toBe('AUTH_SESSION_EXPIRED');
      expect(ERROR_CODES.AUTH_UNAUTHENTICATED).toBe('AUTH_UNAUTHENTICATED');
    });

    it('contient les codes dashboard essentiels', () => {
      expect(ERROR_CODES.DASHBOARD_WIDGET_UNKNOWN).toBe('DASHBOARD_WIDGET_UNKNOWN');
      expect(ERROR_CODES.DASHBOARD_CONFIG_INVALID).toBe('DASHBOARD_CONFIG_INVALID');
      expect(ERROR_CODES.DASHBOARD_INSTANCE_NOT_FOUND).toBe('DASHBOARD_INSTANCE_NOT_FOUND');
      expect(ERROR_CODES.DASHBOARD_FETCH_FAILED).toBe('DASHBOARD_FETCH_FAILED');
    });

    it('contient les codes admin essentiels', () => {
      expect(ERROR_CODES.ADMIN_SELF_DELETE_FORBIDDEN).toBe('ADMIN_SELF_DELETE_FORBIDDEN');
      expect(ERROR_CODES.ADMIN_SELF_ROLE_CHANGE_FORBIDDEN).toBe('ADMIN_SELF_ROLE_CHANGE_FORBIDDEN');
    });
  });
});
