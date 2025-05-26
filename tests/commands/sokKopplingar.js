// tests/commands/sokKopplingar.js
const { expect } = require("@playwright/test");
const { performance } = require('perf_hooks');

/**
 * Söker kopplingar för en verksamhet och mäter responstid på adresser
 */
async function sokKopplingar(page, context) {
  // Navigera till Sök verksamhet
  await page.getByRole("button", { name: "Utsökning rapporter" }).click();
  await page.getByRole("link", { name: "Sök verksamhet" }).click();

  // Fyll i orgnummer
  const orgInput = page.getByRole("textbox", { name: "Organisationsnummer" });
  await orgInput.click();
  await orgInput.waitFor({ state: "visible" });
  await orgInput.fill("");
  await orgInput.type("5560768516", { delay: 300 });

  // Klicka på Sök-knappen för att visa Kopplingar-fliken
  await page
    .locator("header")
    .filter({ hasText: "Sök verksamhet" })
    .getByRole("button")
    .click();

  // Öppna fliken "Kopplingar verksamhet"
  const kopplingstabPanel = page.getByRole("tabpanel", {
    name: "Kopplingar verksamhet",
  });
  await page.getByRole("tab", { name: "Kopplingar verksamhet" }).click();

  // Verifiera dropdown för kopplingstyper
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
  // Välj "Adresser"
  await dropdown.selectOption({ label: "Adresser" });
  console.log(`Valt alternativ i dropdown: ${await dropdown.inputValue()}`);

  // Verifiera anteckningstyp-dropdown
  const anteckningDropdown = page.locator("#selectedanteckningstyp");
  await expect(anteckningDropdown).toBeVisible();
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
  await anteckningDropdown.selectOption({ label: "Alla" });
  console.log(`Valt anteckningstyp: ${await anteckningDropdown.inputValue()}`);

  // Ställ in filterdatum
  await kopplingstabPanel.locator("#datefrom").fill("");
  await kopplingstabPanel
    .locator("#datefrom")
    .fill("2020-04-22", { delay: 300 });

  // === Här mäts responstid efter klick på Sök-knappen (andra instansen) ===
  const pathPart = '/verksamheter/5560768516/kopplingar/adresser';
  const start = performance.now();
  const respPromise = page.waitForResponse(
    resp =>
      resp.url().includes(pathPart) &&
      resp.request().method() === 'GET' &&
      resp.status() === 200,
    { timeout: 30000 }
  );

  // Klicka på den andra Sök-knappen
  await page.getByRole("button", { name: /Sök/ }).nth(1).click();
  await respPromise;
  const duration = performance.now() - start;
  console.log(`🕑 B06_SokKopplingarVerksamhet: ${duration.toFixed(1)} ms`);
  if (context?.metrics?.emit) {
    context.metrics.emit(
      "histogram",
      "B06_SokKopplingarVerksamhet",
      duration
    );
  }

  // Verifiera att tabellen med adresser visas
  const addressTable = kopplingstabPanel.locator("table tbody tr");
  await addressTable.first().waitFor({ state: 'visible', timeout: 10000 });
  const text = await addressTable.first().innerText();
  console.log(`🏷️ Första radens innehåll: "${text.trim()}"`);
  expect(text.trim().length).toBeGreaterThan(0);
}

module.exports = {
  sokKopplingar,
};