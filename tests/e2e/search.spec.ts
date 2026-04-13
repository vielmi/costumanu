import { test, expect } from '@playwright/test'

// ============================================================
// E2E TEST: Suchmodus (öffentlich + eingeloggt)
// ============================================================

test.describe('Suchmodus — öffentlich', () => {
  test('Suchmodus lädt ohne Login', async ({ page }) => {
    await page.goto('/suchmodus')
    await expect(page.getByRole('searchbox').or(page.getByPlaceholder(/suchen/i))).toBeVisible()
  })

  test('Suche nach Begriff zeigt Ergebnisse oder leeren State', async ({ page }) => {
    await page.goto('/suchmodus')
    const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/suchen/i))
    await searchInput.fill('Kleid')
    await page.keyboard.press('Enter')
    // Entweder Ergebnisse oder "keine Ergebnisse" — aber kein Fehler
    await expect(
      page.getByText(/ergebnis|kostüm|keine|gefunden/i)
    ).toBeVisible({ timeout: 5000 })
  })

  test('Direkte URL zu nicht-existierendem Kostüm zeigt 404 oder Fehlermeldung', async ({ page }) => {
    const response = await page.goto('/costume/00000000-0000-0000-0000-000000000000')
    // Entweder 404-Status oder Fehlermeldung auf der Seite
    const is404 = response?.status() === 404
    const hasErrorText = await page.getByText(/nicht gefunden|not found|fehler/i).isVisible()
    expect(is404 || hasErrorText).toBeTruthy()
  })
})
