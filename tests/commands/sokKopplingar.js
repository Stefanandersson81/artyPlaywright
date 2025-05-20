const { expect } = require("@playwright/test");

async function sokKopplingar(page) {
  await page.getByRole("button", { name: "Utsökning rapporter" }).click();
  await page.getByRole("link", { name: "Sök verksamhet" }).click();

  const orgInput = page.getByRole("textbox", { name: "Organisationsnummer" });
  await orgInput.click();
  await orgInput.waitFor({ state: "visible" });
  await orgInput.fill("");
  await orgInput.type("5560768516", { delay: 300 });

  await page
    .locator("header")
    .filter({ hasText: "Sök" })
    .getByRole("button")
    .click();
    /*
  await page.getByRole("link", { name: "Sök" }).click();
  await page.getByText("Rapporter Ladda ner").click();*/
  await page.getByRole("tab", { name: "Kopplingar verksamhet" }).click();

  // === 🧪 Verifiera dropdownens alternativ
  const dropdown = page.locator("#selectedkopplingstyp");

  await expect(dropdown).toBeVisible();

  const expectedOptions = [
    "Välj",
    "Adresser",
    "Andra org. nummer",
    "Avfallskoder",
    "Landskoder",
    "Ombud",
  ];

  const actualOptions = await dropdown.locator("option").allTextContents();

  for (const expected of expectedOptions) {
    expect(actualOptions).toContain(expected);
  }

  // ✅ Välj "Adresser"
  await dropdown.selectOption({ label: "Adresser" });

  // (Valfritt) Verifiera att den är vald
  const selected = await dropdown.inputValue();
  console.log(`Valt alternativ i dropdown: ${selected}`);

  // === 🧪 Verifiera dropdownen med anteckningstyper
  const anteckningDropdown = page.locator("#selectedanteckningstyp");
  await expect(anteckningDropdown).toBeVisible();
///avfallskoder ska in , ska slumpas
  const expectedAnteckningar = [
    "Alla",
    "Avfallsproducent",
    "Behandlare - borttransport",
    "Behandlare - mottagning",
    "Behandlingsresultat",
    "Handel",
    "Insamlare - borttransport",
    "Insamlare - mottagning",
    "Transportör",
  ];

  const actualAnteckningar = await anteckningDropdown
    .locator("option")
    .allTextContents();

  for (const expected of expectedAnteckningar) {
    expect(actualAnteckningar).toContain(expected);
  }

  // ✅ Välj t.ex. "Transportör"
  await anteckningDropdown.selectOption({ label: "Avfallsproducent" });

  // Bekräfta att rätt värde är valt
  const selectedValue = await anteckningDropdown.inputValue();
  console.log(`Valt anteckningstyp: ${selectedValue}`);
  const kopplingstab = page.getByRole("tabpanel", {
    name: "Kopplingar verksamhet",
  });
  await kopplingstab.locator("#datefrom").fill("");
  await kopplingstab.locator("#datefrom").fill("2022-04-22", { delay: 300 });
  await page.getByRole("button", { name: /Sök/ }).nth(0).click();
  await page.getByRole("button", { name: /Sök/ }).nth(1).click();
  await page.waitForTimeout(1000);
// --- efter att du klickat sök-knapparna och öppnat Kopplingar-fliken ----
const kopplingstabPanel = page.getByRole("tabpanel", { name: "Kopplingar verksamhet" });
await expect(kopplingstabPanel).toBeVisible({ timeout: 10_000 });

// Sätt en räknare på raderna under just den här tabpanelen
const rows = kopplingstabPanel.locator("table tbody tr");

// Vänta upp till 30s på att minst en rad blir synlig
await rows.first().waitFor({ state: "visible", timeout: 30_000 });

// Hämta texten från första raden och verifiera att den inte är tom
const firstRow = rows.first();
const text = await firstRow.innerText();
console.log(`🏷️ Första radens innehåll: "${text}"`);
expect(text.trim().length, "Raden ska innehålla minst ett tecken").toBeGreaterThan(0);

}

module.exports = {
  sokKopplingar,
};
