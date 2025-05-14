const { expect } = require("@playwright/test");

async function sokKopplingar(page) {
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
  await page.getByRole("link", { name: "Sök verksamhet" }).click();
  await page.getByRole("tab", { name: "Kopplingar verksamhet" }).click();
  await page.getByText("Rapporter Ladda ner").click();

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
  await anteckningDropdown.selectOption({ label: "Alla" });

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

 const tableContainer = page
  .locator('section.table-container')
  .filter({ hasText: 'DÄCKENA AB' });


}

module.exports = {
  sokKopplingar,
};
