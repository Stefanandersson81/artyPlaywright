const { expect } = require("@playwright/test");

async function behandRES(page) {
  await page.getByRole("tab", { name: "Behandlingsresultat" }).click();
  const orgInput = page.getByRole("textbox", { name: "Organisationsnummer" });
  await orgInput.click();
  await orgInput.waitFor({ state: "visible" });
  await orgInput.fill("");
  await orgInput.type("5560768516", { delay: 300 });
  await page.getByRole("button", { name: /Sök/ }).nth(0).click();
  // Väljer år
  await page.locator("#franar").selectOption("2020");
  await page.getByRole("button", { name: /Sök/ }).nth(1).click();
  await page.waitForTimeout(1000);

  
const Behandlingsresultat = page.getByRole("tabpanel", { name: "Behandlingsresultat" });
await expect(Behandlingsresultat).toBeVisible({ timeout: 10_000 });

// Sätt en räknare på raderna under just den här tabpanelen
const rows = Behandlingsresultat.locator("table tbody tr");

// Vänta upp till 30s på att minst en rad blir synlig
await rows.first().waitFor({ state: "visible", timeout: 30_000 });

// Hämta texten från första raden och verifiera att den inte är tom
const firstRow = rows.first();
const text = await firstRow.innerText();
console.log(`🏷️ Första radens innehåll: "${text}"`);
expect(text.trim().length, "Raden ska innehålla minst ett tecken").toBeGreaterThan(0);

}

module.exports = {
  behandRES,
};
