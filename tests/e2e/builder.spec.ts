import { expect, test, type Page } from "@playwright/test";

async function startFrom(page: Page, purpose: string) {
  await page.goto("/create");
  await page.evaluate(() => localStorage.setItem("cospel:onboarded", "1"));
  await page.getByRole("button", { name: new RegExp(`^${purpose}`) }).first().click();
  await page.waitForURL(/\/create\/[0-9a-f-]{36}$/);
  await expect(page.getByLabel("Pass name")).toBeVisible();
}

const preview = (page: Page) => page.locator("main");

test("creates a loyalty card and edits update the preview instantly", async ({ page }) => {
  await startFrom(page, "Loyalty card");
  await page.locator("#organizationName").fill("Harbor Bakery");
  await page.locator("#logoText").fill("Harbor Bakery");
  await expect(preview(page).getByText("Harbor Bakery")).toBeVisible();

  const firstValue = page.locator('[data-group="primary"]').getByLabel("Value");
  await firstValue.fill("Free croissant");
  await expect(preview(page).getByText("Free croissant")).toBeVisible();
});

test("autosaves locally and survives a reload", async ({ page }) => {
  await startFrom(page, "Membership");
  await page.locator("#organizationName").fill("Persisted Club");
  await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();
  await page.reload();
  await expect(page.locator("#organizationName")).toHaveValue("Persisted Club");
  await page.goto("/create");
  await expect(page.getByRole("link", { name: /Open / }).first()).toBeVisible();
});

test("undo and redo restore edits", async ({ page }) => {
  await startFrom(page, "Coupon");
  const org = page.locator("#organizationName");
  await org.fill("First");
  await page.waitForTimeout(900); // separate undo steps
  await page.getByRole("button", { name: "Design" }).click();
  await page.getByRole("button", { name: "Auto text" }).click();
  await page.getByRole("button", { name: "Content" }).click();
  await org.fill("Second");
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(org).toHaveValue("First");
  await page.getByRole("button", { name: "Redo" }).click();
  await expect(org).toHaveValue("Second");
});

test("switching pass type changes the layout and flags hidden fields", async ({ page }) => {
  await startFrom(page, "Event ticket");
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("radio", { name: /^Poster Generic/ }).click();
  await page.getByRole("tab", { name: /Review/ }).click();
  await expect(page.getByText(/Poster Generic passes don't show secondary fields/)).toBeVisible();
  await page.getByRole("radio", { name: /^Event Ticket/ }).click();
  await expect(page.getByText(/don't show secondary fields/)).toHaveCount(0);
});

test("barcode editor renders a live code", async ({ page }) => {
  await startFrom(page, "Gift card");
  await page.getByRole("button", { name: "Barcode" }).click();
  await page.locator("#barcode-message").fill("GIFT-42");
  await expect(page.getByRole("img", { name: "PDF417: GIFT-42" }).first()).toBeVisible();
  await page.locator("#barcode-format").click();
  await page.getByRole("option", { name: "EAN-13" }).click();
  await page.locator("#barcode-message").fill("12AB");
  await page.getByRole("tab", { name: /Review/ }).click();
  await expect(page.getByText("EAN-13 needs 12 or 13 digits.").first()).toBeVisible();
});

test("live pass.json reflects the visual editor", async ({ page }) => {
  await startFrom(page, "Store card");
  await page.locator("#organizationName").fill("JSON Store");
  await page.getByRole("tab", { name: "JSON" }).click();
  await expect(page.locator("pre")).toContainText('"organizationName": "JSON Store"');
  await expect(page.locator("pre")).toContainText('"storeCard"');
});

test("exports and re-imports a project", async ({ page }) => {
  await startFrom(page, "Generic card");
  await page.locator("#organizationName").fill("Roundtrip Org");
  await page.getByRole("button", { name: "Share and export" }).click();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("menuitem", { name: "Export project" }).click()]);
  expect(download.suggestedFilename()).toMatch(/\.walletpassproject$/);
  const path = await download.path();

  await page.goto("/create");
  await page.locator('input[type=file][accept*="walletpassproject"]').setInputFiles(path);
  await page.waitForURL(/\/create\/[0-9a-f-]{36}$/);
  await expect(page.locator("#organizationName")).toHaveValue("Roundtrip Org");
});

test("opens a template from the gallery", async ({ page }) => {
  await page.goto("/templates/coffee-loyalty");
  await page.getByRole("link", { name: "Use this template" }).click();
  await page.waitForURL(/\/create\/[0-9a-f-]{36}$/);
  await expect(page.locator("#organizationName")).toHaveValue("North Coffee");
});

test("mobile editor has Edit and Preview tabs @mobile", async ({ page }) => {
  await startFrom(page, "Loyalty card");
  await page.locator("#organizationName").fill("Mobile Cafe");
  await page.getByRole("tab", { name: "preview" }).click();
  await expect(preview(page).getByText("Your Business")).toBeVisible(); // logo text unchanged
  await expect(page.locator("#organizationName")).toBeHidden();
});

test("template variables preview with editable sample data", async ({ page }) => {
  await page.goto("/create");
  await page.evaluate(() => localStorage.setItem("cospel:onboarded", "1"));
  await page.goto("/create?template=coffee-loyalty");
  await page.waitForURL(/\/create\/[0-9a-f-]{36}$/);
  await page.getByRole("button", { name: "Data" }).click();
  await page.locator('[id="var-customer.name"]').fill("Lucía Gómez");
  await expect(preview(page).getByText("Lucía Gómez")).toBeVisible();
  await page.getByRole("tab", { name: "JSON" }).click();
  await expect(page.locator("pre")).toContainText('"value": "Lucía Gómez"');
});

test("previews the same design as a Google Wallet pass", async ({ page }) => {
  await startFrom(page, "Loyalty card");
  await page.locator("#organizationName").fill("Android Bakery");
  await page.getByRole("radio", { name: "Google Wallet" }).click();
  await expect(preview(page).getByText("Android Bakery")).toBeVisible();
  await expect(page.getByRole("radio", { name: "Watch" })).toHaveCount(0);
  await expect(page.getByText("Google Wallet · generic layout")).toBeVisible();
});
