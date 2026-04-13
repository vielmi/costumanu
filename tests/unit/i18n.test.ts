import { describe, it, expect } from 'vitest'
import { getTranslations, t } from '@/lib/i18n'

// ============================================================
// UNIT TEST: i18n / Übersetzungen
// ============================================================

describe('getTranslations()', () => {
  it('gibt eine Funktion zurück', () => {
    const translate = getTranslations('de')
    expect(typeof translate).toBe('function')
  })

  it('gibt den Key zurück wenn Übersetzung nicht existiert', () => {
    const translate = getTranslations('de')
    expect(translate('nicht.vorhanden.key')).toBe('nicht.vorhanden.key')
  })
})

describe('t() — Standard-Übersetzungsfunktion', () => {
  it('ist eine Funktion', () => {
    expect(typeof t).toBe('function')
  })

  it('gibt String zurück', () => {
    // Beliebiger Key — gibt entweder Übersetzung oder Key zurück
    const result = t('app.name')
    expect(typeof result).toBe('string')
  })
})
