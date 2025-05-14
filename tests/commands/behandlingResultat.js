const { expect } = require("@playwright/test");

async function behandRES(page) {
  await page.getByRole("tab", { name: "Behandlingsresultat" }).click();
  const orgInput = page.getByRole("textbox", { name: "Organisationsnummer" });
  await orgInput.click();
  await orgInput.waitFor({ state: "visible" });
  await orgInput.fill("");
  await orgInput.type("5567699490", { delay: 100 });
  await page.getByRole("button", { name: /Sök/ }).nth(0).click();
  // Väljer år
  await page.locator("#franar").selectOption("2022");
  await page.getByRole("button", { name: /Sök/ }).nth(1).click();
  await page.waitForTimeout(1000);
  const rows = page.locator(".table-container tbody tr");
  const count = await rows.count();
  expect(count).toBeGreaterThan(0); // minst en rad
  const firstRowText = await rows.first().innerText();
  expect(firstRowText.trim()).not.toBe("");
  await page.waitForTimeout(1000);
  // ladda ned excel -lägg i KÖ
  await page.getByRole("button", { name: /Ladda ner/ }).click();
  await expect(page.locator('[data-id="popup"]')).toBeVisible({
    timeout: 10000,
  });
  await page.locator("#close-popup").click();
  await expect(page.locator('[data-id="popup"]')).toBeHidden({
    timeout: 5000,
  });
  await page.getByRole("link", { name: "Start" }).click();

  const row = page.locator('tbody tr');

// Filtrera rader som har "Bearbetar" i en av sina kolumner
const bearbetarRow = row.filter({ hasText: 'Bearbetar' });

// Kontrollera att en sådan rad existerar
await expect(bearbetarRow.first()).toBeVisible();

}

module.exports = {
  behandRES,
};
