import { test, expect } from '@playwright/test'

// ============================================================
// E2E TEST: Suchmodus (öffentlich + eingeloggt)
// ============================================================

test.describe('Suchmodus — öffentlich', () => {
  test('Suchmodus lädt ohne Login', async ({ page }) => {
    await page.goto('/suchmodus')
    await expect(page).not.toHaveURL(/login/)
  })

  test('Suchmodus zeigt Such-Interface', async ({ page }) => {
    await page.goto('/suchmodus')
    await expect(
      page.getByRole('searchbox')
        .or(page.getByPlaceholder(/suchen/i))
        .or(page.getByRole('textbox', { name: /suchen/i }))
    ).toBeVisible({ timeout: 5000 })
  })

  test('Suche nach Begriff zeigt Ergebnisse oder leeren State — kein Fehler', async ({ page }) => {
    await page.goto('/suchmodus')
    const searchInput = page.getByRole('searchbox')
      .or(page.getByPlaceholder(/suchen/i))
    await searchInput.fill('Kleid')
    await page.keyboard.press('Enter')
    // Entweder Ergebnisse, leerer State oder Ladeindikator — aber kein Error-State
    await expect(page.getByText(/fehler|error/i)).not.toBeVisible({ timeout: 5000 })
  })

  test('Direkte URL zu nicht-existierendem Kostüm zeigt 404 oder Fehlermeldung', async ({ page }) => {
    const response = await page.goto('/costume/00000000-0000-0000-0000-000000000000')
    const is404 = response?.status() === 404
    const hasErrorText = await page.getByText(/nicht gefunden|not found|fehler/i).isVisible()
    expect(is404 || hasErrorText).toBeTruthy()
  })
})

test.describe('Suchmodus — Navigation', () => {
  test('Kategorie-Kacheln sind sichtbar', async ({ page }) => {
    await page.goto('/suchmodus')
    // Mindestens eine Kachel/Tile sichtbar
    const tiles = page.locator('a[href*="results"], a[href*="suche"]')
    await expect(tiles.first()).toBeVisible({ timeout: 5000 })
  })

  test('Klick auf Kategorie-Kachel navigiert zu Ergebnisseite', async ({ page }) => {
    await page.goto('/suchmodus')
    const tile = page.locator('a[href*="results"]').first()
    if (await tile.isVisible()) {
      await tile.click()
      await expect(page).toHaveURL(/results|suche/)
    }
  })
})
