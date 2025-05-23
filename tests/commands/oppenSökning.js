// oppenSökning.js
const { expect } = require("@playwright/test");
const path = require("path");
const { readOrgNumFromCSV } = require("../utils/randomOrg");

async function oppenSökning(page) {
  console.log("📄 Hämtar organisationsnummer…");
  const orgs = await readOrgNumFromCSV(path.join(__dirname, "../fixtures/organisationsNummer.csv"));
  if (!orgs.length) throw new Error("Inga organisationsnummer i CSV");

  const orgNum = orgs[Math.floor(Math.random() * orgs.length)].orgnummer;
  console.log(`▶️ Använder ${orgNum}`);

  // Öppna rätt vy
  await page.locator('button:has-text("Utsökning rapporter")').click();
  await page.locator('a:has-text("Öppen sökning")').click();

  // Fyll i och sök
  const orgInput = page.locator('#organisationsnummer');
  await orgInput.waitFor({ state: "visible", timeout: 10000 });
  await orgInput.fill(orgNum, { delay: 400 });
  await page.locator('input#datefrom').fill("2020-04-11");

  // Funktion för att alltid trycka på rätt "Sök"-knapp
  async function clickSok() {
    const sokButton = page.locator('button[type="submit"]', { hasText: 'Sök' });
    await sokButton.first().click();
  }

  await clickSok();

  // Försök hitta pagination, men gå vidare om den inte finns
  let pag = page.locator(".pagination span").first();
  let hasPagination = true;
  try {
    await pag.waitFor({ state: "visible", timeout: 10000 });
  } catch {
    hasPagination = false;
  }

  let total = 0;
  let filterStep = 0;

  if (hasPagination) {
    // Loop för att filtrera tills < 20000 träffar
    while (true) {
      const text = await pag.innerText();
      total = parseInt(text.match(/av\s*([\d\s]+)/i)[1].replace(/\s/g, ''), 10);
      console.log(`ℹ️ Totalt: ${total}`);

      if (total < 20000) break;

      // Lägg på nästa filter
      filterStep++;
      if (filterStep === 1) {
        await page.locator('input#kommunkod').fill("0100 - Stockholms län", { delay: 400 });
        await page.locator('#options-kommunkod').click();
        await page.waitForTimeout(1000);
      } else if (filterStep === 2) {
        await page.locator('#anteckningstyp').selectOption({ label: "Avfallsproducent" });
      } else {
        throw new Error("❌ För många träffar även efter alla filter!");
      }

      await clickSok();
      await pag.waitFor({ state: "visible", timeout: 10000 });
    }

    // När vi har < 20000 träffar, vänta på och klicka på "Ladda ner"
    await page.getByRole('button', { name: /Ladda ner/ }).waitFor({ state: "visible", timeout: 20000 });
    await page.getByRole('button', { name: /Ladda ner/ }).click();
    await page.waitForTimeout(2000);

  } else {
    // Ingen pagination, vänta på att "Ladda ner"-knappen syns och klicka
    console.log("ℹ️ Ingen pagination hittades, väntar på Ladda ner-knappen.");
    await page.getByRole('button', { name: /Ladda ner/ }).waitFor({ state: "visible", timeout: 20000 });
    await page.getByRole('button', { name: /Ladda ner/ }).click();
    await page.waitForTimeout(2000);
  }

  // Hantera popup direkt efter klick
  const popup = page.locator('[data-id="popup"]');
  if (await popup.isVisible({ timeout: 20000 }).catch(() => false)) {
    await page.locator("#close-popup").click();
    await page.waitForTimeout(1000);
    await popup.waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});
  }

  // Navigera hem
  await page.locator('a:has-text("Start")').click();

  // Kontrollera status-tabell och vänta på "Ladda ner"-knappen och status
  const statusTab = page.locator(".table-container").nth(1);
  await statusTab.waitFor({ state: "visible", timeout: 30000 });

  const cell = statusTab.locator("tbody tr").first().locator("td").nth(1);
  let found = false;
  for (let i = 0; i < 36; i++) { // Max 6 minuter (36 * 10s)
    // Kontrollera status-text
    await expect(cell).toHaveText(/I kö|Bearbetar|Redo att ladda ner/, { timeout: 10000 });
    // Kontrollera om "Ladda ner"-knappen syns
    const downloadButton = statusTab.locator('tbody tr').first().locator('button', { hasText: 'Ladda ner' });
    if (await downloadButton.isVisible().catch(() => false)) {
      found = true;
      break;
    }
    // Vänta 10 sekunder och ladda om sidan/tabellen
    await page.reload();
    await statusTab.waitFor({ state: "visible", timeout: 120000 });
  }
  if (!found) {
    throw new Error("❌ Ladda ner-knappen dök aldrig upp inom väntetiden.");
  }
  console.log(`✅ Status = ${await cell.innerText()}`);
}

module.exports = { oppenSökning };
