const { expect } = require('@playwright/test');
const path = require('path');
const { readOrgNumFromCSV } = require('../utils/randomOrg');

let orgListPromise;
async function getSokOrg() {
  if (!orgListPromise) {
    const csvPath = path.join(__dirname, '../fixtures/organisationsNummer.csv');
    orgListPromise = readOrgNumFromCSV(csvPath);
  }
  return orgListPromise;
}

async function sokOrg(page) {
  console.log('Hämtar organisationsnummer från CSV...');
  const orgList = await getSokOrg();
  if (!orgList.length) {
    throw new Error('Inga organisationsnummer hittades i CSV-filen');
  }
  // Välj ett organisationsnummer (t.ex. slumpmässigt)
  const randomIndex = Math.floor(Math.random() * orgList.length);
  const record = orgList[randomIndex];
  const orgNum = record.orgnummer || record.OrgNumber || record['orgnummer'] || record['OrgNumber'];
  console.log(`▶️ Använder orgnummer: ${orgNum}`);

  // Navigera till söksidan
  await page.getByRole('button', { name: 'Utsökning rapporter' }).click();
  await page.getByRole('link', { name: 'Sök verksamhet' }).click();

  // Fyll i och skicka sökningen
  const orgInput = page.getByRole('textbox', { name: 'Organisationsnummer' });
  await orgInput.click();
  await orgInput.waitFor({ state: 'visible' });
  await orgInput.fill(orgNum);
  await page
    .locator('header')
    .filter({ hasText: 'Sök verksamhet' })
    .getByRole('button')
    .click();


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


  // Verifiera att resultatet innehåller valt orgNum
  const firstRow = page.locator('table tbody tr').first();
  await expect(firstRow).toBeVisible();
  await firstRow.click();

  console.log('✅ Verifierar popup och verksamhetsinfo');
  await page.waitForSelector('[data-id="popup"]', { state: 'visible' });
  await expect(page.locator('#verksamhetsutovare')).toContainText(orgNum);
  await page.click('#close-popup');
}

module.exports = {
  sokOrg,
};
