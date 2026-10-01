import { expect, test } from "@playwright/test";

for (const path of ["/", "/templates", "/examples", "/pricing", "/for-business", "/docs", "/privacy", "/terms"]) {
  test(`renders ${path} without errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("business contact form validates required fields", async ({ page }) => {
  await page.goto("/for-business#contact");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("Company is required")).toBeVisible();
});
