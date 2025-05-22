const { expect } = require('@playwright/test');
const path = require('path');
const { readOmBudFromCSV } = require('../utils/randomOmBud');

let ombudLista;
async function getOrgList() {
  if (!ombudLista) {
    const csvPath = path.join(__dirname, '../fixtures/ombud.csv');
    ombudLista = readOmBudFromCSV(csvPath);
  }
  return ombudLista;
}

async function sokOmbud(page) {
  console.log('📄 Steg 2: Hämtar ombud från CSV...');
  const orgList = await getOrgList();
  if (!orgList.length) {
    throw new Error('Inga ombud hittades i CSV-filen');
  }

  // Välj ett ombudsnummer (slumpmässigt)
  const randomIndex = Math.floor(Math.random() * orgList.length);
  const record = orgList[randomIndex];
  const ombudNummer = record.ombud || record.ombud || record['ombud'] || record['ombud'];
  console.log(`▶️ Använder ombudNummermer: ${ombudNummer}`);

  // Navigera till söksidan
  await page.getByRole('button', { name: 'Utsökning rapporter' }).click();
  await page.getByRole('link', { name: 'Öppen sökning' }).click();

  // Fyll i och skicka sökningen
  const orgInput = page.getByRole('textbox', { name: 'ombud' });
  await orgInput.click();
  await orgInput.waitFor({ state: 'visible' });
  await orgInput.fill(ombudNummer);
  await page.getByRole('button', { name: /Sök/ }).click();
  await page.waitForTimeout(1000);

const maxTimeoutMs = 60000;
const startTime = Date.now();

while (Date.now() - startTime < maxTimeoutMs) {
  await page.waitForTimeout(3000);
  console.log('manuellt timeout 3 sek');

  const firstRow = page.locator('table tbody tr').first();

  try {
    await expect(firstRow).toBeVisible({ timeout: 3000 });
    break;
  } catch {
    console.log('hittar inget för sökning,ändra sökning');
  }
  
}


  // Verifiera att resultatet innehåller valt ombudNummer
  const firstRow = page.locator('table tbody tr').first();
  await expect(firstRow).toBeVisible();
  await firstRow.click();

  console.log('✅ Verifierar popup och verksamhetsinfo');
  await page.waitForSelector('[data-id="popup"]', { state: 'visible' });
  console.log(ombudNummer);
  await expect(page.locator('section#ombud')).toContainText(ombudNummer);

  await page.click('#close-popup');
}

module.exports = {
  sokOmbud,
};
