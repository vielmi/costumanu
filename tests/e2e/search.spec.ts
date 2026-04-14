import { test, expect } from '@playwright/test'

// ============================================================
// E2E TEST: Suchmodus (öffentlich + eingeloggt)
// ============================================================

test.describe('Suchmodus — öffentlich', () => {
  test('Suchmodus lädt ohne Login', async ({ page }) => {
    await page.goto('/suchmodus')
    await page.waitForLoadState('networkidle')
    await expect(page).not.toHaveURL(/login/)
  })

  test('Suchmodus zeigt Such-Interface', async ({ page }) => {
    await page.goto('/suchmodus')
    await page.waitForLoadState('networkidle')
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="uchen" i], input[type="text"][placeholder*="uchen" i], [role="searchbox"]'
    ).first()
    await expect(searchInput).toBeVisible({ timeout: 10000 })
  })

  test('Suche nach Begriff zeigt Ergebnisse oder leeren State — kein Fehler', async ({ page }) => {
    await page.goto('/suchmodus')
    await page.waitForLoadState('networkidle')
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="uchen" i], input[type="text"][placeholder*="uchen" i], [role="searchbox"]'
    ).first()
    await searchInput.waitFor({ state: 'visible', timeout: 10000 })
    await searchInput.fill('Kleid')
    await page.keyboard.press('Enter')
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
    await page.waitForLoadState('networkidle')
    const tiles = page.locator('a[href*="results"], a[href*="suche"]')
    await expect(tiles.first()).toBeVisible({ timeout: 10000 })
  })

  test('Klick auf Kategorie-Kachel navigiert zu Ergebnisseite', async ({ page }) => {
    await page.goto('/suchmodus')
    await page.waitForLoadState('networkidle')
    const tile = page.locator('a[href*="results"], a[href*="suche"]').first()
    await tile.waitFor({ state: 'visible', timeout: 10000 })
    await tile.click()
    await expect(page).toHaveURL(/results|suche/, { timeout: 10000 })
  })
})
