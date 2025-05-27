const { expect } = require('@playwright/test');
const path = require('path');
const { readOmBudFromCSV } = require('../utils/randomOmBud');

let ombudLista;
async function getOmbudLista() {
  if (!ombudLista) {
    const csvPath = path.join(__dirname, '../fixtures/ombud.csv');
    ombudLista = readOmBudFromCSV(csvPath);
  }
  return ombudLista;
}

async function sokOmbud(page, vuContext, events, test) {
  const step = test?.step || (async (_name, fn) => await fn());

  await step("Hämta ombud från CSV", async () => {
    console.log('📄 Hämtar ombud från CSV...');
    const orgList = await getOmbudLista();
    if (!orgList.length) {
      throw new Error('Inga ombud hittades i CSV-filen');
    }

    const randomIndex = Math.floor(Math.random() * orgList.length);
    const record = orgList[randomIndex];
    const ombudNummer = record.ombud || record['ombud'];
    console.log(`▶️ Använder ombudNummermer: ${ombudNummer}`);
    page.__testOmbud = ombudNummer;
  });

  await step("Navigera till Öppen sökning och fyll i ombud", async () => {
    await page.getByRole('button', { name: 'Utsökning rapporter' }).click();
    await page.getByRole('link', { name: 'Öppen sökning' }).click();

    const orgInput = page.getByRole('textbox', { name: 'ombud' });
    await orgInput.click();
    await orgInput.waitFor({ state: 'visible' });
    await orgInput.fill(page.__testOmbud);
    await page.getByRole('button', { name: /Sök/ }).click();
    await page.waitForTimeout(1000);
  });

  await step("Vänta på sökresultat och verifiera popup", async () => {
    const maxTimeoutMs = 60000;
    const startTime = Date.now();
    let found = false;

    while (Date.now() - startTime < maxTimeoutMs) {
      await page.waitForTimeout(3000);
      console.log('manuellt timeout 3 sek');

      const firstRow = page.locator('table tbody tr').first();
      try {
        await expect(firstRow).toBeVisible({ timeout: 3000 });
        found = true;
        break;
      } catch {
        console.log('hittar inget för sökning, ändra sökning');
      }
    }

    if (!found) throw new Error("❌ Timeout - inga sökresultat för ombud");

    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible();
    await firstRow.click();

    console.log('✅ Verifierar popup och verksamhetsinfo');
    await page.waitForSelector('[data-id="popup"]', { state: 'visible' });
    console.log(page.__testOmbud);
    await expect(page.locator('section#ombud')).toContainText(page.__testOmbud);

    await page.click('#close-popup');
  });
}

module.exports = {
  sokOmbud,
};