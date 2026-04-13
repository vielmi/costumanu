import { test as base, expect, type Page } from '@playwright/test'

// ============================================================
// SHARED FIXTURES — Rolle-basierte Logins
// ============================================================

export type RoleCredentials = {
  email: string
  password: string
}

// Credentials aus .env.test / GitHub Secrets
export const USERS = {
  platformAdmin: {
    email:    process.env.TEST_ADMIN_EMAIL    || '',
    password: process.env.TEST_ADMIN_PASSWORD || '',
  },
  // Stadttheater Zürich
  finja: {  // owner
    email:    process.env.TEST_OWNER_A_EMAIL    || '',
    password: process.env.TEST_OWNER_A_PASSWORD || '',
  },
  alma: {   // member
    email:    process.env.TEST_MEMBER_A_EMAIL    || '',
    password: process.env.TEST_MEMBER_A_PASSWORD || '',
  },
  viktor: { // viewer
    email:    process.env.TEST_VIEWER_A_EMAIL    || '',
    password: process.env.TEST_VIEWER_A_PASSWORD || '',
  },
  // Stadttheater Bern
  klara: {  // owner
    email:    process.env.TEST_OWNER_B_EMAIL    || '',
    password: process.env.TEST_OWNER_B_PASSWORD || '',
  },
  sina: {   // member
    email:    process.env.TEST_MEMBER_B_EMAIL    || '',
    password: process.env.TEST_MEMBER_B_PASSWORD || '',
  },
  leo: {    // viewer
    email:    process.env.TEST_VIEWER_B_EMAIL    || '',
    password: process.env.TEST_VIEWER_B_PASSWORD || '',
  },
}

// ─── Login-Hilfsfunktion ──────────────────────────────────────
export async function loginAs(page: Page, user: RoleCredentials) {
  await page.goto('/login')
  await page.getByLabel(/e-mail/i).fill(user.email)
  await page.getByLabel(/passwort/i).fill(user.password)
  await page.getByRole('button', { name: /anmelden|login/i }).click()
  await page.waitForURL(/cockpit|fundus/, { timeout: 10000 })
}

// Rückwärtskompatibel: Standard-Login via TEST_ADMIN_EMAIL
export async function login(page: Page) {
  await loginAs(page, USERS.platformAdmin)
}

// ─── Fixtures ─────────────────────────────────────────────────
type Fixtures = {
  asAdmin:  Page  // Manuela — Platform Admin
  asFinja:  Page  // Stadttheater Zürich — owner
  asAlma:   Page  // Stadttheater Zürich — member
  asViktor: Page  // Stadttheater Zürich — viewer
  asKlara:  Page  // Stadttheater Bern   — owner
  asSina:   Page  // Stadttheater Bern   — member
  asLeo:    Page  // Stadttheater Bern   — viewer
}

export const test = base.extend<Fixtures>({
  asAdmin:  async ({ page }, use) => { await loginAs(page, USERS.platformAdmin); await use(page) },
  asFinja:  async ({ page }, use) => { await loginAs(page, USERS.finja);         await use(page) },
  asAlma:   async ({ page }, use) => { await loginAs(page, USERS.alma);          await use(page) },
  asViktor: async ({ page }, use) => { await loginAs(page, USERS.viktor);        await use(page) },
  asKlara:  async ({ page }, use) => { await loginAs(page, USERS.klara);         await use(page) },
  asSina:   async ({ page }, use) => { await loginAs(page, USERS.sina);          await use(page) },
  asLeo:    async ({ page }, use) => { await loginAs(page, USERS.leo);           await use(page) },
})

export { expect }
