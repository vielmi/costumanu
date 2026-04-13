import { test, expect } from '@playwright/test'

// ============================================================
// E2E TEST: Authentifizierung
// ============================================================

test.describe('Login Flow', () => {
  test('Login-Seite ist erreichbar', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/kostüm\+/i)
    await expect(page.getByRole('heading', { name: /anmelden|login/i })).toBeVisible()
  })

  test('Login mit falschen Credentials zeigt Fehlermeldung', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/e-mail/i).fill('falsch@test.ch')
    await page.getByLabel(/passwort/i).fill('falschespasswort')
    await page.getByRole('button', { name: /anmelden|login/i }).click()
    await expect(page.getByText(/ungültig|falsch|fehler|invalid/i)).toBeVisible()
  })

  test('Unauthentifizierter Zugriff auf Cockpit leitet zu Login weiter', async ({ page }) => {
    await page.goto('/cockpit')
    await expect(page).toHaveURL(/login/)
  })

  test('Unauthentifizierter Zugriff auf Fundus leitet zu Login weiter', async ({ page }) => {
    await page.goto('/fundus')
    await expect(page).toHaveURL(/login/)
  })

  test('Öffentliche Suchmodus-Seite ist ohne Login erreichbar', async ({ page }) => {
    await page.goto('/suchmodus')
    // Suchmodus hat öffentlichen Modus — kein Redirect zu Login erwartet
    await expect(page).not.toHaveURL(/login/)
  })
})
