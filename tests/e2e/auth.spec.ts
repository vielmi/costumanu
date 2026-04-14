import { test, expect } from '@playwright/test'
import { login } from './fixtures'

// ============================================================
// E2E TEST: Authentifizierung
// ============================================================

const EMAIL = process.env.TEST_USER_EMAIL || ''
const PASSWORD = process.env.TEST_USER_PASSWORD || ''

test.describe('Login Flow', () => {
  test('Login-Seite ist erreichbar', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/kostüm\+/i)
  })

  test('Login mit falschen Credentials zeigt Fehlermeldung', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/e-mail/i).fill('falsch@test.ch')
    await page.getByLabel(/passwort/i).fill('falschespasswort')
    await page.getByRole('button', { name: /anmelden|login/i }).click()
    await expect(page.getByText(/ungültig|falsch|fehler|invalid/i)).toBeVisible({ timeout: 5000 })
  })

  test('Unauthentifizierter Zugriff auf Cockpit leitet zu Login weiter', async ({ page }) => {
    await page.goto('/cockpit')
    await expect(page).toHaveURL(/login/)
  })

  test('Unauthentifizierter Zugriff auf Fundus leitet zu Login weiter', async ({ page }) => {
    await page.goto('/fundus')
    await expect(page).toHaveURL(/login/)
  })

  test('Unauthentifizierter Zugriff auf Kostüme Neu leitet zu Login weiter', async ({ page }) => {
    await page.goto('/kostueme/neu')
    await expect(page).toHaveURL(/login/)
  })

  test('Öffentliche Suchmodus-Seite ist ohne Login erreichbar', async ({ page }) => {
    await page.goto('/suchmodus')
    await expect(page).not.toHaveURL(/login/)
  })
})

test.describe('Login + Logout', () => {
  test.skip(!EMAIL || !PASSWORD, 'TEST_USER_EMAIL / TEST_USER_PASSWORD nicht gesetzt')

  test('Erfolgreicher Login leitet auf Cockpit oder Fundus weiter', async ({ page }) => {
    await login(page)
    await expect(page).not.toHaveURL(/login/)
  })

  test('Nach Login ist Cockpit sichtbar', async ({ page }) => {
    await login(page)
    await page.goto('/cockpit')
    await expect(page).not.toHaveURL(/login/)
  })

  test('Logout leitet auf Login-Seite weiter', async ({ page }) => {
    await login(page)
    // Avatar-Button klicken um Dropdown zu öffnen
    const avatarBtn = page.getByRole('button', { name: /profil|account|user|avatar/i }).first()
    if (await avatarBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await avatarBtn.click()
    }
    // Abmelden-Button klicken (direkt sichtbar oder nach Dropdown)
    await page.getByRole('button', { name: /abmelden/i }).click()
    await expect(page).toHaveURL(/login/, { timeout: 5000 })
  })

  test('Nach Logout ist Cockpit nicht mehr erreichbar', async ({ page }) => {
    await login(page)
    // Session-Cookies löschen simuliert Logout
    await page.context().clearCookies()
    await page.goto('/cockpit')
    await expect(page).toHaveURL(/login/)
  })
})
