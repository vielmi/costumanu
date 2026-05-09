import { test, expect } from "./fixtures";

// ============================================================
// E2E TEST: Suchmodus (Login erforderlich)
// ============================================================

test.describe("Suchmodus — eingeloggt", () => {
  test("Suchmodus lädt nach Login", async ({ asAdmin: page }) => {
    await page.goto("/suchmodus");
    await page.waitForLoadState("networkidle");
    await expect(page).not.toHaveURL(/login/);
  });

  test("Suchmodus zeigt Such-Interface", async ({ asAdmin: page }) => {
    await page.goto("/suchmodus");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('a[href*="results"]').first()).toBeVisible({ timeout: 10000 });
  });

  test("Suche nach Begriff zeigt Ergebnisse oder leeren State — kein Fehler", async ({
    asAdmin: page,
  }) => {
    await page.goto("/suchmodus/search");
    await page.waitForLoadState("networkidle");
    const searchInput = page.locator('input[type="search"]').first();
    await searchInput.waitFor({ state: "visible", timeout: 10000 });
    await searchInput.fill("Kleid");
    await page.keyboard.press("Enter");
    await expect(page.getByText(/fehler|error/i)).not.toBeVisible({ timeout: 5000 });
  });

  test("Direkte URL zu nicht-existierendem Kostüm zeigt 404 oder Fehlermeldung", async ({
    asAdmin: page,
  }) => {
    const response = await page.goto("/suchmodus/costume/00000000-0000-0000-0000-000000000000");
    const is404 = response?.status() === 404;
    const hasErrorText = await page.getByText(/nicht gefunden|not found|fehler/i).isVisible();
    expect(is404 || hasErrorText).toBeTruthy();
  });
});

test.describe("Suchmodus — Navigation", () => {
  test("Kategorie-Kacheln sind sichtbar", async ({ asAdmin: page }) => {
    await page.goto("/suchmodus");
    await page.waitForLoadState("networkidle");
    const tiles = page.locator('a[href*="results"]');
    await expect(tiles.first()).toBeVisible({ timeout: 10000 });
  });

  test("Klick auf Kategorie-Kachel navigiert zu Ergebnisseite", async ({ asAdmin: page }) => {
    await page.goto("/suchmodus");
    await page.waitForLoadState("networkidle");
    const tile = page.locator('a[href*="results"]').first();
    await tile.waitFor({ state: "visible", timeout: 10000 });
    await Promise.all([page.waitForURL(/results/, { timeout: 15000 }), tile.click()]);
    await expect(page).toHaveURL(/results/);
  });

  test("Anon wird zu Login weitergeleitet", async ({ page }) => {
    await page.goto("/suchmodus");
    await expect(page).toHaveURL(/login/);
  });
});
