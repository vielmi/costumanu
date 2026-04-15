import { test, expect } from './fixtures'

// ============================================================
// E2E TEST: Kostüm erfassen
// ============================================================

test.describe('Kostüm erfassen', () => {
  test.skip(
    !process.env.TEST_OWNER_A_EMAIL || !process.env.TEST_OWNER_A_PASSWORD,
    'TEST_OWNER_A_EMAIL / TEST_OWNER_A_PASSWORD nicht gesetzt'
  )

  test('Formular "Neues Kostüm" ist erreichbar', async ({ asFinja: page }) => {
    await page.goto('/kostueme/neu')
    await expect(page).not.toHaveURL(/login/)
    // Exakter Placeholder des Namensfelds
    await expect(
      page.getByPlaceholder('z.B. Abendkleid aus Satin & Tüll')
    ).toBeVisible({ timeout: 8000 })
  })

  test('Alle drei Kostüm-Typen sind über URL-Parameter erreichbar', async ({ asFinja: page }) => {
    for (const type of ['single', 'ensemble', 'serie']) {
      await page.goto(`/kostueme/neu?type=${type}`)
      await expect(page).not.toHaveURL(/login/)
      await expect(
        page.getByPlaceholder('z.B. Abendkleid aus Satin & Tüll')
      ).toBeVisible({ timeout: 8000 })
    }
  })

  test('Speichern-Button ist disabled solange Name leer', async ({ asFinja: page }) => {
    await page.goto('/kostueme/neu')
    await expect(page).not.toHaveURL(/login/)
    const saveBtn = page.getByRole('button', { name: /speichern/i })
    await expect(saveBtn).toBeDisabled({ timeout: 8000 })
  })

  test('Speichern-Button wird aktiv nach Namenseingabe', async ({ asFinja: page }) => {
    await page.goto('/kostueme/neu')
    await page.getByPlaceholder('z.B. Abendkleid aus Satin & Tüll').fill('Test Kostüm E2E')
    const saveBtn = page.getByRole('button', { name: /speichern/i })
    await expect(saveBtn).toBeEnabled({ timeout: 5000 })
  })
})
