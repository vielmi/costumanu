import { test, expect } from './fixtures'

// ============================================================
// E2E TEST: Kostüm erfassen
// ============================================================

const KOSTÜM_NAME = `E2E Test Kostüm ${Date.now()}`

test.describe('Kostüm erfassen', () => {
  test.skip(
    !process.env.TEST_ADMIN_EMAIL || !process.env.TEST_ADMIN_PASSWORD,
    'TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD nicht gesetzt'
  )

  test('Formular "Neues Kostüm" ist erreichbar', async ({ asAdmin: page }) => {
    await page.goto('/kostueme/neu')
    await expect(page).not.toHaveURL(/login/)
    await expect(page.getByRole('heading', { name: /kostüm|erfassen|neu/i })).toBeVisible()
  })

  test('Alle drei Kostüm-Typen sind über URL-Parameter erreichbar', async ({ asAdmin: page }) => {
    for (const type of ['single', 'ensemble', 'serie']) {
      await page.goto(`/kostueme/neu?type=${type}`)
      await expect(page).not.toHaveURL(/login/)
      await expect(page.getByRole('heading', { name: /kostüm|erfassen|neu/i })).toBeVisible()
    }
  })

  test('Formular zeigt Pflichtfeld-Fehler bei leerem Namen', async ({ asAdmin: page }) => {
    await page.goto('/kostueme/neu')
    await page.getByRole('button', { name: /speichern|erfassen|erstellen/i }).click()
    await expect(page.getByText(/pflichtfeld|erforderlich|required/i)).toBeVisible({ timeout: 3000 })
  })

  test('Neues Kostüm kann erfasst werden', async ({ asAdmin: page }) => {
    await page.goto('/kostueme/neu')
    await page.getByLabel(/name/i).fill(KOSTÜM_NAME)
    await page.getByRole('button', { name: /speichern|erfassen|erstellen/i }).click()
    await expect(
      page.getByText(/gespeichert|erfolgreich/i)
        .or(page.getByText(KOSTÜM_NAME))
    ).toBeVisible({ timeout: 8000 })
  })

  test('Erfasstes Kostüm erscheint im Fundus', async ({ asAdmin: page }) => {
    // Kostüm erfassen
    await page.goto('/kostueme/neu')
    const name = `Fundus-Test ${Date.now()}`
    await page.getByLabel(/name/i).fill(name)
    await page.getByRole('button', { name: /speichern|erfassen|erstellen/i }).click()
    await page.waitForURL(/fundus|kostueme/, { timeout: 8000 })

    // Im Fundus suchen
    await page.goto('/fundus')
    await expect(page.getByText(name)).toBeVisible({ timeout: 5000 })
  })
})
