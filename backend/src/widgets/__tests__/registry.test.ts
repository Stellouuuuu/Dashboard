import { describe, it, expect } from 'vitest';
import {
  WIDGET_REGISTRY,
  getWidgetDefinition,
  listWidgetDefinitions,
} from '../../widgets/registry.js';

describe('widgets/registry.ts', () => {
  describe('WIDGET_REGISTRY', () => {
    it('contient au moins 10 widgets', () => {
      expect(Object.keys(WIDGET_REGISTRY).length).toBeGreaterThanOrEqual(10);
    });

    it('chaque widget a un service valide', () => {
      const validServices = ['weather', 'github', 'rss', 'finance', 'hackernews'];
      for (const [name, def] of Object.entries(WIDGET_REGISTRY)) {
        expect(validServices, `Widget "${name}" a un service invalide`).toContain(def.service);
      }
    });

    it('chaque widget a un name, description et params', () => {
      for (const [key, def] of Object.entries(WIDGET_REGISTRY)) {
        expect(def.name, `Widget "${key}" doit avoir un name`).toBeTruthy();
        expect(def.description, `Widget "${key}" doit avoir une description`).toBeTruthy();
        expect(Array.isArray(def.params), `Widget "${key}" doit avoir params[]`).toBe(true);
      }
    });

    it('le name de chaque widget correspond à sa clé dans le registre', () => {
      for (const [key, def] of Object.entries(WIDGET_REGISTRY)) {
        expect(def.name).toBe(key);
      }
    });

    it('chaque widget a un schema Zod et une fonction fetch', () => {
      for (const [key, def] of Object.entries(WIDGET_REGISTRY)) {
        expect(typeof def.schema.safeParse, `Widget "${key}" doit avoir un schema.safeParse`).toBe('function');
        expect(typeof def.fetch, `Widget "${key}" doit avoir une fonction fetch`).toBe('function');
      }
    });

    it('contient city_temperature (weather)', () => {
      expect(WIDGET_REGISTRY.city_temperature.service).toBe('weather');
    });

    it('contient recent_commits (github)', () => {
      expect(WIDGET_REGISTRY.recent_commits.service).toBe('github');
    });

    it('contient exchange_rate (finance)', () => {
      expect(WIDGET_REGISTRY.exchange_rate.service).toBe('finance');
    });

    it('contient top_stories (hackernews)', () => {
      expect(WIDGET_REGISTRY.top_stories.service).toBe('hackernews');
    });

    it('contient feed_summary (rss)', () => {
      expect(WIDGET_REGISTRY.feed_summary.service).toBe('rss');
    });
  });

  describe('getWidgetDefinition()', () => {
    it('retourne la définition d\'un widget existant', () => {
      const def = getWidgetDefinition('city_temperature');
      expect(def).toBeDefined();
      expect(def?.name).toBe('city_temperature');
      expect(def?.service).toBe('weather');
    });

    it('retourne undefined pour un widget inconnu', () => {
      const def = getWidgetDefinition('widget_inexistant');
      expect(def).toBeUndefined();
    });

    it('retourne undefined pour une chaîne vide', () => {
      const def = getWidgetDefinition('');
      expect(def).toBeUndefined();
    });
  });

  describe('listWidgetDefinitions()', () => {
    it('retourne un tableau non vide', () => {
      const list = listWidgetDefinitions();
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThan(0);
    });

    it('retourne le même nombre que WIDGET_REGISTRY', () => {
      const list = listWidgetDefinitions();
      expect(list.length).toBe(Object.keys(WIDGET_REGISTRY).length);
    });

    it('chaque entrée a service, name, description, params', () => {
      for (const def of listWidgetDefinitions()) {
        expect(def.service).toBeTruthy();
        expect(def.name).toBeTruthy();
        expect(def.description).toBeTruthy();
        expect(Array.isArray(def.params)).toBe(true);
      }
    });
  });

  describe('Validation des schémas Zod', () => {
    it('city_temperature accepte city et unit valides', () => {
      const result = WIDGET_REGISTRY.city_temperature.schema.safeParse({ city: 'Paris', unit: 'C' });
      expect(result.success).toBe(true);
    });

    it('city_temperature rejette une config vide', () => {
      const result = WIDGET_REGISTRY.city_temperature.schema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('exchange_rate accepte des codes ISO valides', () => {
      const result = WIDGET_REGISTRY.exchange_rate.schema.safeParse({ base: 'USD', target: 'EUR' });
      expect(result.success).toBe(true);
    });

    it('exchange_rate rejette des codes invalides (>3 lettres)', () => {
      const result = WIDGET_REGISTRY.exchange_rate.schema.safeParse({ base: 'USDT', target: 'EUR' });
      expect(result.success).toBe(false);
    });

    it('top_stories accepte number entre 1 et 30', () => {
      const result = WIDGET_REGISTRY.top_stories.schema.safeParse({ number: 10 });
      expect(result.success).toBe(true);
    });

    it('top_stories rejette number > 30', () => {
      const result = WIDGET_REGISTRY.top_stories.schema.safeParse({ number: 50 });
      expect(result.success).toBe(false);
    });

    it('recent_commits normalise une URL GitHub en owner/repo', () => {
      const result = WIDGET_REGISTRY.recent_commits.schema.safeParse({
        repository: 'https://github.com/octocat/Hello-World',
        limit: 5,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.repository).toBe('octocat/Hello-World');
      }
    });

    it('recent_commits accepte le format owner/repo', () => {
      const result = WIDGET_REGISTRY.recent_commits.schema.safeParse({
        repository: 'torvalds/linux',
        limit: 10,
      });
      expect(result.success).toBe(true);
    });

    it('recent_commits rejette limit > 20', () => {
      const result = WIDGET_REGISTRY.recent_commits.schema.safeParse({
        repository: 'octocat/Hello-World',
        limit: 50,
      });
      expect(result.success).toBe(false);
    });

    it('article_list rejette une URL invalide', () => {
      const result = WIDGET_REGISTRY.article_list.schema.safeParse({
        link: 'pas_une_url',
        number: 5,
      });
      expect(result.success).toBe(false);
    });

    it('article_list accepte une URL valide', () => {
      const result = WIDGET_REGISTRY.article_list.schema.safeParse({
        link: 'https://feeds.feedburner.com/TechCrunch',
        number: 5,
      });
      expect(result.success).toBe(true);
    });

    it('precipitation_forecast rejette days > 7', () => {
      const result = WIDGET_REGISTRY.precipitation_forecast.schema.safeParse({
        city: 'Lyon',
        days: 10,
      });
      expect(result.success).toBe(false);
    });
  });
});
