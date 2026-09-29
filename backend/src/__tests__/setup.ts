import { vi } from 'vitest';

// Variables d'environnement nécessaires pour les tests (sans vraie DB ni secrets)
process.env.NODE_ENV = 'test';
// Clé AES-256 de 32 octets = 64 caractères hex (générée aléatoirement pour les tests)
process.env.CRYPTO_KEY = 'a'.repeat(64);
process.env.JWT_SECRET = 'test-jwt-secret-for-unit-tests-only';
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test';
process.env.APP_URL = 'http://localhost:8080';
process.env.SMTP_HOST = 'localhost';
process.env.SMTP_PORT = '1025';
process.env.SMTP_SECURE = 'false';
process.env.SMTP_USER = '';
process.env.SMTP_PASS = '';
process.env.SMTP_FROM = 'test@test.local';
process.env.ADMIN_EMAIL = 'admin@test.local';
process.env.SECRETS_DIR = '/tmp/test-secrets';
