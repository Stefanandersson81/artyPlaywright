const { expect } = require('@playwright/test');
const path = require('path');
const { readOrgNumFromCSV } = require('../utils/randomOrg');

const withTransactionTimer = async (transactionName, events, userActions) => {
  const startedTime = Date.now();
  try {
    await userActions();
  } catch (err) {
    console.error(`❌ Fel i steg ${transactionName}:`, err);
    throw err;
  } finally {
    const duration = Date.now() - startedTime;
    if (events?.emit) {
      events.emit("histogram", transactionName, duration);
    }
  }
};


let orgListPromise;
async function getSokVerksamhet() {
  if (!orgListPromise) {
    const csvPath = path.join(__dirname, '../fixtures/organisationsNummer.csv');
    orgListPromise = readOrgNumFromCSV(csvPath);
  }
  return orgListPromise;
}

async function sokVerksamhet(page, vuContext, events) {
  console.log('📄 Läser CSV...');
  const orgList = await getSokVerksamhet();
  if (!orgList.length) throw new Error('❌ Inga organisationsnummer hittades i CSV-filen');

  const record = orgList[Math.floor(Math.random() * orgList.length)];
  const orgNum = record.orgnummer || record.OrgNumber || record['orgnummer'] || record['OrgNumber'];
  console.log(`▶️ Använder orgnummer: ${orgNum}`);
  page.__testOrgNum = orgNum;

 
    await page.getByRole('button', { name: 'Utsökning rapporter' }).click();
    await page.getByRole('link', { name: 'Sök verksamhet' }).click();
 

  const referenceEndpoints = [
    { name: 'omraden', path: '/referencedata/omraden' },
    { name: 'avfallstyper', path: '/referencedata/avfallstyper' },
    { name: 'behandlingsmetoder', path: '/referencedata/behandlingsmetoder' },
    { name: 'underkoder', path: '/referencedata/underkoder' }
  ];

  await withTransactionTimer("B03_SokVerksamhetSida", events, async () => {
    const promises = referenceEndpoints.map(e =>
      page.waitForResponse(
        resp => resp.url().includes(e.path) && resp.status() === 200,
        { timeout: 60000 }
      )
    );
    await Promise.all(promises);
  });
  await page.waitForTimeout(5000); // Väntar i x sekunder

  await withTransactionTimer("B04_SökOrgnummer", events, async () => {
    const orgInput = page.getByRole('textbox', { name: 'Organisationsnummer' });
    await orgInput.waitFor({ state: 'visible', timeout: 10000 });
    await orgInput.fill(orgNum);

    const notePromise = page.waitForResponse(
      resp =>
        resp.url().includes('/anteckningar/latest?Verksamhetsutovare') &&
        resp.status() === 200,
      { timeout: 30000 }
    );

    await page.locator("header:has-text('Sök verksamhet')").getByRole('button').click();
    await notePromise;
  });
  await page.waitForTimeout(3000);
  await withTransactionTimer("B05_VisaRapport", events, async () => {
    const firstRow = page.locator('table tbody tr').first();
    const startTime = Date.now();

    while (Date.now() - startTime < 60000) {
      
      try {
        await expect(firstRow).toBeVisible({ timeout: 3000 });
        break;
      } catch {
        console.log("⏳ Ingen rad än, försöker igen...");
      }
    }

    if (!(await firstRow.isVisible())) {
      throw new Error("❌ Timeout – ingen rad hittades");
    }

    await firstRow.click();
    

    await page.waitForSelector('[data-id="popup"]', { state: 'visible', timeout: 10000 });
    await expect(page.locator('#verksamhetsutovare')).toContainText(orgNum);
    await page.click('#close-popup');

    const reportPromise = page.waitForResponse(
      r => r.url().includes('/anteckningar?avfallId=') && r.status() === 200,
      { timeout: 30000 }
    );

    await firstRow.click();
    await reportPromise;
  });
  await page.waitForTimeout(8000);
}

module.exports = { sokVerksamhet };
