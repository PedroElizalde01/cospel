import { expect, test, type Page } from "@playwright/test";

const unique = () => `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;

async function signUp(page: Page, next = "/studio") {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.evaluate(() => localStorage.setItem("cospel:onboarded", "1"));
  await page.getByRole("radio", { name: "Sign up" }).click();
  await page.getByLabel("Your name").fill("Pedro Test");
  await page.getByLabel("Email").fill(unique());
  await page.getByLabel("Password").fill("correct horse battery");
  await page.getByRole("button", { name: "Create account" }).click();
}

async function onboard(page: Page, business = "Test Café") {
  await page.waitForURL(/\/onboarding$/);
  await page.getByLabel("Business name").fill(business);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(/\/studio$/);
}

test("Studio requires login", async ({ page }) => {
  await page.goto("/studio");
  await expect(page).toHaveURL(/\/login\?next=%2Fstudio/);
});

test("sign up, create a business, create and edit a pass that persists", async ({ page }) => {
  await signUp(page);
  await onboard(page, "North Coffee Test");
  await expect(page.getByText("Create your first Wallet pass")).toBeVisible();

  await page.getByRole("link", { name: "New pass" }).first().click();
  await page.getByRole("button", { name: /Coffee loyalty/ }).click();
  await page.waitForURL(/\/studio\/passes\/[0-9a-f-]{36}$/);
  await page.locator("#organizationName").fill("Saved In Database");
  await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();
  await page.waitForTimeout(600);

  await page.reload();
  await expect(page.locator("#organizationName")).toHaveValue("Saved In Database");
  await page.getByRole("link", { name: "Back to my passes" }).click();
  await expect(page.getByRole("link", { name: /Open Coffee loyalty/ })).toBeVisible();
});

test("uploads an image to the account", async ({ page }) => {
  await signUp(page);
  await onboard(page);
  await page.goto("/studio/new");
  await page.getByRole("button", { name: /^Membership/ }).click();
  await page.waitForURL(/\/studio\/passes\//);
  await page.getByRole("button", { name: "Design" }).click();
  // 64x64 red PNG generated in the page.
  const png = await page.evaluate(async () => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    c.getContext("2d")!.fillRect(0, 0, 64, 64);
    const b = await new Promise<Blob>((r) => c.toBlob((x) => r(x!), "image/png"));
    return Array.from(new Uint8Array(await b.arrayBuffer()));
  });
  await page.locator("#image-icon input[type=file]").setInputFiles({ name: "icon.png", mimeType: "image/png", buffer: Buffer.from(png) });
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.locator('#image-icon img[src^="/api/assets/"]')).toBeVisible();
});

test("asset upload rejects anonymous requests", async ({ request }) => {
  const res = await request.post("/api/assets", { multipart: { file: { name: "x.png", mimeType: "image/png", buffer: Buffer.from([1, 2, 3]) } } });
  expect(res.status()).toBe(401);
});

test("saves a playground draft to the account", async ({ page }) => {
  await signUp(page);
  await onboard(page);
  await page.goto("/create");
  await page.getByRole("button", { name: /^Event ticket/ }).click();
  await page.waitForURL(/\/create\/[0-9a-f-]{36}$/);
  await page.locator("#organizationName").fill("From Playground");
  await page.getByRole("button", { name: /Save to my account/ }).click();
  await page.waitForURL(/\/studio\/passes\/[0-9a-f-]{36}$/);
  await expect(page.locator("#organizationName")).toHaveValue("From Playground");
});
