import { test, expect } from '@playwright/test'

// ============================================================
// E2E TEST: Kostüm erfassen
// ============================================================
// Voraussetzung: TEST_USER_EMAIL und TEST_USER_PASSWORD in .env.test

const EMAIL = process.env.TEST_USER_EMAIL || ''
const PASSWORD = process.env.TEST_USER_PASSWORD || ''

test.describe('Kostüm erfassen', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.getByLabel(/e-mail/i).fill(EMAIL)
    await page.getByLabel(/passwort/i).fill(PASSWORD)
    await page.getByRole('button', { name: /anmelden|login/i }).click()
    await page.waitForURL(/cockpit|fundus/)
  })

  test('Formular "Neues Kostüm" ist erreichbar', async ({ page }) => {
    await page.goto('/kostueme/neu')
    await expect(page.getByRole('heading', { name: /kostüm|erfassen|neu/i })).toBeVisible()
  })

  test('Formular zeigt Pflichtfeld-Fehler bei leerem Namen', async ({ page }) => {
    await page.goto('/kostueme/neu')
    await page.getByRole('button', { name: /speichern|erfassen|erstellen/i }).click()
    await expect(page.getByText(/pflichtfeld|erforderlich|required/i)).toBeVisible()
  })

  test('Neues Kostüm kann erfasst werden', async ({ page }) => {
    await page.goto('/kostueme/neu')
    await page.getByLabel(/name/i).fill('E2E Test Kostüm')
    await page.getByRole('button', { name: /speichern|erfassen|erstellen/i }).click()
    // Erfolg: Weiterleitung auf Detailseite oder Erfolgsmeldung
    await expect(
      page.getByText(/gespeichert|erfolgreich|E2E Test Kostüm/i)
    ).toBeVisible({ timeout: 5000 })
  })
})
