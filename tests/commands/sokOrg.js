const { expect } = require("@playwright/test");

async function sokOrg(page) {
  console.log("📄 Steg 2: Fyller i första organisationsnummer");

  await page.getByRole("button", { name: "Utsökning rapporter" }).click();
  await page.getByRole("link", { name: "Sök verksamhet" }).click();

  const orgInput = page.getByRole("textbox", { name: "Organisationsnummer" });
  await orgInput.click();
  await orgInput.waitFor({ state: "visible" });
  await orgInput.type("5560768516", { delay: 100 });

  await page
    .locator("header")
    .filter({ hasText: "Sök verksamhet" })
    .getByRole("button")
    .click();

  const firstRow = page.locator("table tbody tr").first();
  await expect(firstRow).toBeVisible();
  await expect(firstRow).not.toHaveText("");
  await firstRow.click();

  console.log("✅ Verifierar popup och verksamhetsinfo (1)");

  await page.waitForSelector('[data-id="popup"]', { state: "visible" });
  await page.waitForSelector("#verksamhetsutovare", { state: "visible" });
  await expect(page.locator("#verksamhetsutovare")).toContainText("5560768516");

  await page.waitForSelector("#close-popup", {
    state: "visible",
    timeout: 5000,
  });
  await page.click("#close-popup");
  await page.waitForTimeout(5000);
}

module.exports = {
  sokOrg,
};
