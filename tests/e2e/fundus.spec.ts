import { test, expect } from './fixtures'

// ============================================================
// E2E TEST: Fundus
// ============================================================

test.describe('Fundus', () => {
  test.skip(
    !process.env.TEST_ADMIN_EMAIL || !process.env.TEST_ADMIN_PASSWORD,
    'TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD nicht gesetzt'
  )

  test('Fundus-Seite lädt nach Login', async ({ asAdmin: page }) => {
    await page.goto('/fundus')
    await expect(page).not.toHaveURL(/login/)
    // Kein Bootstrap-Fehler
    await expect(page.getByText(/fehler beim erstellen des theaters/i)).not.toBeVisible()
  })

  test('Fundus zeigt Kostüm-Liste oder leeren State', async ({ asAdmin: page }) => {
    await page.goto('/fundus')
    // Entweder Kostüme sind sichtbar oder ein leerer Hinweis
    const hasCostumes = await page.getByRole('article').count() > 0
    const hasEmptyState = await page.getByText(/noch keine kostüme|leer|hinzufügen/i).isVisible()
    expect(hasCostumes || hasEmptyState).toBeTruthy()
  })

  test('Fundus hat Schaltfläche zum Erfassen neuer Kostüme', async ({ asAdmin: page }) => {
    await page.goto('/fundus')
    await expect(
      page.getByRole('link', { name: /neu|erfassen|hinzufügen/i })
        .or(page.getByRole('button', { name: /neu|erfassen|hinzufügen/i }))
    ).toBeVisible()
  })
})
