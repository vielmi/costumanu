import { test, expect } from './fixtures'

// ============================================================
// E2E TEST: Kostüm erfassen
// ============================================================

const KOSTÜM_NAME = `E2E Test Kostüm ${Date.now()}`

test.describe('Kostüm erfassen', () => {
  test.skip(
    !process.env.TEST_OWNER_A_EMAIL || !process.env.TEST_OWNER_A_PASSWORD,
    'TEST_OWNER_A_EMAIL / TEST_OWNER_A_PASSWORD nicht gesetzt'
  )

  test('Formular "Neues Kostüm" ist erreichbar', async ({ asFinja: page }) => {
    await page.goto('/kostueme/neu')
    await expect(page).not.toHaveURL(/login/)
    await expect(page.getByLabel(/name des kostüms/i)).toBeVisible({ timeout: 8000 })
  })

  test('Alle drei Kostüm-Typen sind über URL-Parameter erreichbar', async ({ asFinja: page }) => {
    for (const type of ['single', 'ensemble', 'serie']) {
      await page.goto(`/kostueme/neu?type=${type}`)
      await expect(page).not.toHaveURL(/login/)
      await expect(page.getByLabel(/name des kostüms/i)).toBeVisible({ timeout: 8000 })
    }
  })

  test('Formular zeigt Pflichtfeld-Fehler bei leerem Namen', async ({ asFinja: page }) => {
    await page.goto('/kostueme/neu')
    await page.getByRole('button', { name: /speichern|erfassen|erstellen/i }).click()
    await expect(page.getByText(/pflichtfeld|erforderlich|required/i)).toBeVisible({ timeout: 3000 })
  })

  test('Neues Kostüm kann erfasst werden', async ({ asFinja: page }) => {
    await page.goto('/kostueme/neu')
    await page.getByLabel(/name/i).fill(KOSTÜM_NAME)
    await page.getByRole('button', { name: /speichern|erfassen|erstellen/i }).click()
    await expect(
      page.getByText(/gespeichert|erfolgreich/i)
        .or(page.getByText(KOSTÜM_NAME))
    ).toBeVisible({ timeout: 8000 })
  })

  test('Erfasstes Kostüm erscheint im Fundus', async ({ asFinja: page }) => {
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
