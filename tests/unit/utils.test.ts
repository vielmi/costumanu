import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

// ============================================================
// UNIT TEST: Utility Funktionen
// ============================================================

describe('cn() — Tailwind Klassen zusammenführen', () => {
  it('gibt eine einzelne Klasse zurück', () => {
    expect(cn('text-red-500')).toBe('text-red-500')
  })

  it('merged mehrere Klassen', () => {
    expect(cn('p-4', 'm-2')).toBe('p-4 m-2')
  })

  it('überschreibt doppelte Tailwind-Klassen korrekt', () => {
    // twMerge soll p-2 durch p-4 ersetzen
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('ignoriert falsy Werte', () => {
    expect(cn('p-4', false, undefined, null, '')).toBe('p-4')
  })

  it('verarbeitet bedingte Klassen', () => {
    const isActive = true
    expect(cn('base', isActive && 'active')).toBe('base active')
  })

  it('gibt leeren String zurück bei keinen Klassen', () => {
    expect(cn()).toBe('')
  })
})
