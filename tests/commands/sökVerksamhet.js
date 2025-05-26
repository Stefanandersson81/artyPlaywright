// tests/commands/sokVerksamhet.js
const { expect } = require('@playwright/test');
const path = require('path');
const { performance } = require('perf_hooks');
const { readOrgNumFromCSV } = require('../utils/randomOrg');

let orgListPromise;
async function getSokVerksamhet() {
  if (!orgListPromise) {
    const csvPath = path.join(__dirname, '../fixtures/organisationsNummer.csv');
    orgListPromise = readOrgNumFromCSV(csvPath);
  }
  return orgListPromise;
}

/**
 * Söker verksamhet och mäter svarstider för referensdata, anteckningar och rapportvisning
 * @param {import('@playwright/test').Page} page
 * @param {{metrics?: {emit: (type: string, name: string, value: number) => void}}} context
 */
async function sokVerksamhet(page, context) {
  console.log('Hämtar organisationsnummer från CSV...');
  const orgList = await getSokVerksamhet();
  if (!orgList.length) throw new Error('Inga organisationsnummer hittades i CSV-filen');

  const randomIndex = Math.floor(Math.random() * orgList.length);
  const record = orgList[randomIndex];
  const orgNum = record.orgnummer || record.OrgNumber || record['orgnummer'] || record['OrgNumber'];
  console.log(`▶️ Använder orgnummer: ${orgNum}`);

  // Navigera till söksidan
  await page.getByRole('button', { name: 'Utsökning rapporter' }).click();
  await page.getByRole('link', { name: 'Sök verksamhet' }).click();

  // ─── Mät referensdata-anrop efter navigering till Sök verksamhet ──────────
  const referenceEndpoints = [
    { name: 'omraden', path: '/referencedata/omraden' },
    { name: 'avfallstyper', path: '/referencedata/avfallstyper' },
    { name: 'behandlingsmetoder', path: '/referencedata/behandlingsmetoder' },
    { name: 'underkoder', path: '/referencedata/underkoder' }
  ];
  const refTimers = {};
  const refPromises = referenceEndpoints.map(e => {
    refTimers[e.name] = performance.now();
    return page.waitForResponse(
      resp => resp.url().includes(e.path) && resp.request().method() === 'GET' && resp.status() === 200,
      { timeout: 10000 }
    ).then(() => {
      const ms = performance.now() - refTimers[e.name];
      console.log(`🕑 ${e.name}: ${ms.toFixed(1)} ms`);
      context?.metrics?.emit('histogram', e.name, ms);
    });
  });
  await Promise.all(refPromises);

  // ─── Fyll i och skicka sökningen ──────────────────────────────────────────
  const orgInput = page.getByRole('textbox', { name: 'Organisationsnummer' });
  await orgInput.waitFor({ state: 'visible' });
  await orgInput.fill(orgNum);

  // Förbered mätning för B04_sokOrgNummer (anteckningar/latest)
  const notePath = '/anteckningar/latest?Verksamhetsutovare';
  const noteStart = performance.now();
  const notePromise = page.waitForResponse(
    resp => resp.url().includes(notePath) && resp.request().method() === 'GET' && resp.status() === 200,
    { timeout: 30000 }
  );

  // Klicka på Sök-knappen för att trigga anteckningar-anropet
  await page.locator('header').filter({ hasText: 'Sök verksamhet' }).getByRole('button').click();
  await notePromise;
  const noteMs = performance.now() - noteStart;
  console.log(`🕑 B04_sokOrgNummer: ${noteMs.toFixed(1)} ms`);
  context?.metrics?.emit('histogram', 'B04_sokOrgNummer', noteMs);

  // Vänta på sökresultat och klicka första rad för popup
  const maxTimeoutMs = 60000;
  const startTime = Date.now();
  let firstRow;
  while (Date.now() - startTime < maxTimeoutMs) {
    await page.waitForTimeout(3000);
    console.log('manuellt timeout 3 sek');
    firstRow = page.locator('table tbody tr').first();
    try {
      await expect(firstRow).toBeVisible({ timeout: 3000 });
      break;
    } catch {
      console.log('hittar inget för sökning, ändra sökning');
    }
  }
  if (!firstRow) throw new Error('Timeout, hittade ingen rad');
  await firstRow.click();

  // Verifiera popup och stäng
  console.log('✅ Verifierar popup och verksamhetsinfo');
  await page.waitForSelector('[data-id="popup"]', { state: 'visible', timeout: 10000 });
  await expect(page.locator('#verksamhetsutovare')).toContainText(orgNum);
  await page.click('#close-popup');

  // ─── Mätning för B05_VisaRapport ─────────────────────────────────────────
  // GET /anteckningar?avfallId=... efter popup stängs
  const reportPath = '/anteckningar?avfallId=';
  const reportStart = performance.now();
  const reportPromise = page.waitForResponse(
    resp => resp.url().includes(reportPath) && resp.request().method() === 'GET' && resp.status() === 200,
    { timeout: 30000 }
  );
  // Klicka igen på samma rad för att trigga rapport-anropet
  await firstRow.click();
  await reportPromise;
  const reportMs = performance.now() - reportStart;
  console.log(`🕑 B05_VisaRapport: ${reportMs.toFixed(1)} ms`);
  if (context?.metrics?.emit) {
    context.metrics.emit('histogram', 'B05_VisaRapport', reportMs);
  }
}

module.exports = { sokVerksamhet };
