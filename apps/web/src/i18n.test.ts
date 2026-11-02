import { describe, expect, it } from 'vitest';
import { translations } from './i18n';
describe('operator localization', () => {
  it('has complete English and Spanish dictionaries', () => {
    expect(Object.keys(translations.es).sort()).toEqual(Object.keys(translations.en).sort());
  });
  it('has nonempty distinct language labels', () => {
    for (const key of Object.keys(translations.en) as (keyof typeof translations.en)[]) {
      expect(translations.es[key].trim()).not.toBe('');
      expect(translations.en[key].trim()).not.toBe('');
    }
    expect(translations.es.incidents).toBe('Incidencias');
  });
  it('keeps human confirmation distinct from unverified inference', () => {
    expect(translations.en.confirmed).toContain('Human');
    expect(translations.es.confirmed).toContain('persona');
    expect(translations.en.unverified).not.toBe(translations.en.confirmed);
  });
});
