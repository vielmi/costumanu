import { test, expect, USERS } from './fixtures'

// ============================================================
// E2E TEST: Rollen-basierte Zugriffskontrolle
// ============================================================
// Testet dass jede Rolle nur das sehen/tun kann was erlaubt ist.
// Theater A und B sind isoliert — kein Cross-Theater-Zugriff.
// ============================================================

const hasFinja  = !!USERS.finja.email  && !!USERS.finja.password
const hasAlma   = !!USERS.alma.email   && !!USERS.alma.password
const hasViktor = !!USERS.viktor.email && !!USERS.viktor.password
const hasKlara  = !!USERS.klara.email  && !!USERS.klara.password

// ─── Finja Fundusleitung (owner, Zürich) ─────────────────────
test.describe('Finja Fundusleitung — owner, Stadttheater Zürich', () => {
  test.skip(!hasFinja, 'TEST_OWNER_A_* nicht gesetzt')

  test('Fundus ist erreichbar', async ({ asFinja: page }) => {
    await page.goto('/fundus')
    await expect(page).not.toHaveURL(/login/)
    await expect(page.getByText(/fehler beim erstellen/i)).not.toBeVisible()
  })

  test('Kostüm erfassen ist erlaubt', async ({ asFinja: page }) => {
    await page.goto('/kostueme/neu')
    await expect(page).not.toHaveURL(/login|cockpit/)
    await expect(page.getByRole('heading', { name: /kostüm|erfassen|neu/i })).toBeVisible()
  })

  test('Konfiguration ist erreichbar', async ({ asFinja: page }) => {
    await page.goto('/einstellungen/konfiguration')
    await expect(page).not.toHaveURL(/login/)
  })
})

// ─── Alma Assistentin (member, Zürich) ───────────────────────
test.describe('Alma Assistentin — member, Stadttheater Zürich', () => {
  test.skip(!hasAlma, 'TEST_MEMBER_A_* nicht gesetzt')

  test('Fundus ist erreichbar', async ({ asAlma: page }) => {
    await page.goto('/fundus')
    await expect(page).not.toHaveURL(/login/)
  })

  test('Kostüm erfassen ist erlaubt', async ({ asAlma: page }) => {
    await page.goto('/kostueme/neu')
    await expect(page).not.toHaveURL(/login|cockpit/)
    await expect(page.getByRole('heading', { name: /kostüm|erfassen|neu/i })).toBeVisible()
  })

  test('Konfiguration ist NICHT erreichbar', async ({ asAlma: page }) => {
    await page.goto('/einstellungen/konfiguration')
    await expect(page).not.toHaveURL(/konfiguration/)
  })
})

// ─── Viktor Volontär (viewer, Zürich) ────────────────────────
test.describe('Viktor Volontär — viewer, Stadttheater Zürich', () => {
  test.skip(!hasViktor, 'TEST_VIEWER_A_* nicht gesetzt')

  test('Login leitet auf Suchmodus weiter', async ({ asViktor: page }) => {
    await expect(page).toHaveURL(/suchmodus/)
  })

  test('Suchmodus ist erreichbar', async ({ asViktor: page }) => {
    await page.goto('/suchmodus')
    await expect(page).not.toHaveURL(/login/)
  })

  test('Kostüm erfassen ist NICHT erreichbar', async ({ asViktor: page }) => {
    await page.goto('/kostueme/neu')
    await expect(page).not.toHaveURL(/kostueme\/neu/)
  })

  test('Konfiguration ist NICHT erreichbar', async ({ asViktor: page }) => {
    await page.goto('/einstellungen/konfiguration')
    await expect(page).not.toHaveURL(/konfiguration/)
  })
})

// ─── Cross-Theater-Isolation ──────────────────────────────────
test.describe('Cross-Theater-Isolation', () => {
  test.skip(!hasFinja || !hasKlara, 'TEST_OWNER_A_* oder TEST_OWNER_B_* nicht gesetzt')

  test('Finja sieht nur Kostüme von Stadttheater Zürich', async ({ asFinja: page }) => {
    await page.goto('/fundus')
    await expect(page.getByText('Stadttheater Bern')).not.toBeVisible()
  })

  test('Klara sieht nur Kostüme von Stadttheater Bern', async ({ asKlara: page }) => {
    await page.goto('/fundus')
    await expect(page.getByText('Stadttheater Zürich')).not.toBeVisible()
  })

  test('Finja kann Konfiguration von Stadttheater Bern nicht aufrufen', async ({ asFinja: page }) => {
    await page.goto('/einstellungen/konfiguration?theater=aaaaaaaa-0002-0000-0000-000000000000')
    await expect(page).not.toHaveURL(/login/)
    // Nur eigene Theater-Daten sichtbar — Bern-Daten dürfen nicht erscheinen
    await expect(page.getByText('Klara Kostümleitung')).not.toBeVisible()
  })
})

// ─── Anon ────────────────────────────────────────────────────
test.describe('Anon — kein Login', () => {
  test('Suchmodus erreichbar', async ({ page }) => {
    await page.goto('/suchmodus')
    await expect(page).not.toHaveURL(/login/)
  })

  test('Fundus nicht erreichbar', async ({ page }) => {
    await page.goto('/fundus')
    await expect(page).toHaveURL(/login/)
  })

  test('Cockpit nicht erreichbar', async ({ page }) => {
    await page.goto('/cockpit')
    await expect(page).toHaveURL(/login/)
  })

  test('Kostüm erfassen nicht erreichbar', async ({ page }) => {
    await page.goto('/kostueme/neu')
    await expect(page).toHaveURL(/login/)
  })

  test('Konfiguration nicht erreichbar', async ({ page }) => {
    await page.goto('/einstellungen/konfiguration')
    await expect(page).toHaveURL(/login/)
  })
})
