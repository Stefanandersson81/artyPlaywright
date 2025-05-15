const { expect } = require("@playwright/test");

async function oppenSökning(page) {
  await page.getByRole("button", { name: "Utsökning rapporter" }).click();
  await page.getByRole("link", { name: "Öppen sökning" }).click();

  const orgInput = page.getByRole("textbox", { name: "organisationsnummer" });
  await orgInput.click();
  await orgInput.waitFor({ state: "visible" });
  await orgInput.type("5567699490", { delay: 100 });

  await page.locator("#datefrom").fill("2024-06-11");
  await page.getByRole("button", { name: /Sök/ }).nth(0).click();

  const firstRow = page.locator("table tbody tr").first();
  await expect(firstRow).toBeVisible();
  await expect(firstRow).not.toHaveText("");

  // lägg till filter för kommun 0184 - Solna
  await page.locator("#kommunkod").fill("0184 - Solna");
  await page.getByRole("button", { name: /Sök/ }).nth(0).click();
  const row = page.locator("table tbody tr").first();
  await expect(row).toBeVisible();
  await expect(row).not.toHaveText("");

  await page
    .locator("#anteckningstyp")
    .selectOption({ label: "Avfallsproducent" });
  await page.getByRole("button", { name: /Sök/ }).nth(0).click();
  const rows = page.locator("table tbody tr").first();
  await expect(rows).toBeVisible();
  await expect(rows).not.toHaveText("");

  await page.getByRole("button", { name: /Ladda ner/ }).click();
  await expect(page.locator('[data-id="popup"]')).toBeVisible({
    timeout: 10000,
  });
  await page.locator("#close-popup").click();
  await expect(page.locator('[data-id="popup"]')).toBeHidden({
    timeout: 5000,
  });
  await page.getByRole("link", { name: "Start" }).click();

const andraTabellen = page.locator('.table-container').nth(1);
await expect(andraTabellen).toBeVisible();
//första raden finns
const förstaRaden = andraTabellen.locator('tbody tr').first();
await expect(förstaRaden).toBeVisible();
// Vänta på att status-cellen innehåller "I kö"
const statusCell = förstaRaden.locator('td').nth(1); // kolumn 2 = status
await expect(statusCell).toContainText('I kö');
console.log('✅ Status är "I kö"');

//reload-loop för att vänta på "Bearbetar"
const maxTimeoutMs = 60000;
const startTime = Date.now();
let hittat = false;

while (Date.now() - startTime < maxTimeoutMs) {
  await page.waitForTimeout(5000);
  await page.reload();
  console.log('🔄 Sida reloadad');

  const nyTabell = page.locator('.table-container').nth(1);
  const nyRad = nyTabell.locator('tbody tr').first();
  const nyStatusCell = nyRad.locator('td').nth(1);

  try {
    await expect(nyRad).toBeVisible({ timeout: 3000 });
    await expect(nyStatusCell).toContainText('Bearbetar', { timeout: 2000 });
    console.log('✅ Status har uppdaterats till "Bearbetar"');
    hittat = true;
    break;
  } catch {
    console.log('⏳ Status är inte Bearbetar ännu...');
  }
}

if (!hittat) {
  throw new Error('❌ Timeout – status blev aldrig "Bearbetar" inom 60 sek');
}

}

module.exports = {
  oppenSökning,
};
