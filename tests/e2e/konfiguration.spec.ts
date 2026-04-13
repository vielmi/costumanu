import { test, expect } from './fixtures'

// ============================================================
// E2E TEST: Konfigurationsseite
// ============================================================
// Voraussetzung: TEST_USER_EMAIL muss Platform Admin sein
// ============================================================

test.describe('Konfiguration — Zugriff', () => {
  test.skip(
    !process.env.TEST_ADMIN_EMAIL || !process.env.TEST_ADMIN_PASSWORD,
    'TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD nicht gesetzt'
  )

  test('Konfigurationsseite ist für eingeloggten Admin erreichbar', async ({ asAdmin: page }) => {
    await page.goto('/einstellungen/konfiguration')
    await expect(page).not.toHaveURL(/login/)
    // Kein unerwarteter Fehler
    await expect(page.getByText(/interner fehler|server error/i)).not.toBeVisible()
  })

  test('Konfigurationsseite zeigt Theater-Liste oder User-Liste', async ({ asAdmin: page }) => {
    await page.goto('/einstellungen/konfiguration')
    // Platform Admin sieht Theater-Übersicht, Theater-Admin sieht Mitglieder
    await expect(
      page.getByText(/theater|mitglied|benutzer|konfiguration/i)
    ).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Konfiguration — Unauthentifiziert', () => {
  test('Konfigurationsseite leitet unauthentifizierte User zu Login weiter', async ({ page }) => {
    await page.goto('/einstellungen/konfiguration')
    await expect(page).toHaveURL(/login/)
  })
})
