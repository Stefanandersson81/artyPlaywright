const { expect } = require("@playwright/test");

async function andraSokOrg(page) {
  console.log("📄 Steg 3: Fyller i andra organisationsnummer");
  const orgInput = page.getByRole("textbox", { name: "Organisationsnummer" });
  await orgInput.fill("");
  await orgInput.waitFor({ state: "visible" });
  await orgInput.type("5567699490", { delay: 200 });
  await page
    .locator("header")
    .filter({ hasText: "Sök verksamhet" })
    .getByRole("button")
    .click();
    await page.waitForTimeout(2000);
  const secondRow = page.locator("table tbody tr").first();
  await expect(secondRow).toBeVisible();
  await expect(secondRow).not.toHaveText("");
  await secondRow.click();

  console.log("✅ Verifierar popup och verksamhetsinfo (2)");

  await page.waitForSelector('[data-id="popup"]', { state: "visible" });
  await page.waitForSelector("#verksamhetsutovare", { state: "visible" });
  await expect(page.locator("#verksamhetsutovare")).toContainText("5567699490");

  await page.waitForSelector("#close-popup", {
    state: "visible",
    timeout: 5000,
  });
  await page.click("#close-popup");
}

module.exports = {
  andraSokOrg,
};
