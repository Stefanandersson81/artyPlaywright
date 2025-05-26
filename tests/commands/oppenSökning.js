// oppenSökning.js (med metrics via metrics.emit för Artillery)
const { expect } = require("@playwright/test");
const path = require("path");
const { readOrgNumFromCSV } = require("../utils/randomOrg");

// Lägg till metrics-objekt som andra parameter
async function oppenSökning(page, { metrics }) {
  console.log("📄 Hämtar organisationsnummer…");
  const orgs = await readOrgNumFromCSV(path.join(__dirname, "../fixtures/organisationsNummer.csv"));
  if (!orgs.length) throw new Error("Inga organisationsnummer i CSV");

  const orgNum = orgs[Math.floor(Math.random() * orgs.length)].orgnummer;
  console.log(`▶️ Använder ${orgNum}`);

  // Öppna rätt vy
  await page.locator('button:has-text("Utsökning rapporter")').click();
  await page.locator('a:has-text("Öppen sökning")').click();

  // Logga referensdata-metrics
  const base = 'https://tillsynsportalenapitestidentity.naturvardsverket.se/referencedata';
  const t0 = performance.now();
  const fetchMetrics = ['avfallstyper','omraden'].map(endpoint =>
    page.waitForResponse(r => r.url() === `${base}/${endpoint}` && r.status() === 200)
      .then(() => {
        const value = Math.round(performance.now() - t0);
        console.log(`✅ Metric ${endpoint}: ${value}ms`);
        metrics.emit("histogram", endpoint, value);
      })
  );
  await page.click('a:has-text("Öppen sökning")');
  await Promise.all(fetchMetrics);

  // Fyll i och sök
  const orgInput = page.locator('#organisationsnummer');
  await orgInput.waitFor({ state: "visible", timeout: 10000 });
  await orgInput.fill(orgNum, { delay: 400 });
  await page.locator('input#datefrom').fill("2020-04-11");

  const clickSok = () => page.locator('button[type="submit"]', { hasText: 'Sök' }).first().click();

  // A04: advanced-sökning
  await clickSok();
  const t1 = performance.now();
  await page.waitForResponse(r =>
    r.url().endsWith('/anteckningar/search/advanced') &&
    r.request().method() === 'POST' && r.status() === 200
  );
  const val04 = Math.round(performance.now() - t1);
  console.log(`✅ Metric A_04ÖppenSökning: ${val04}ms`);
  metrics.emit("histogram", "A_04ÖppenSökning", val04);

  // Pagination-filtrering
  const pag = page.locator('.pagination span').first();
  try {
    await pag.waitFor({ state: "visible", timeout: 10000 });
    let count, step = 0;
    while ((count = parseInt((await pag.innerText()).match(/av\s*([\d\s]+)/i)[1].replace(/\s/g,''), 10)) >= 20000) {
      console.log(`ℹ️ Totalt: ${count}`);
      step++;
      if (step === 1) {
        await page.locator('input#kommunkod').fill("0100 - Stockholms län", { delay: 400 });
        await page.locator('#options-kommunkod').click();
      } else if (step === 2) {
        await page.locator('#anteckningstyp').selectOption({ label: "Avfallsproducent" });
      } else {
        throw new Error("❌ För många träffar!");
      }
      await clickSok();
      await pag.waitFor({ state: "visible", timeout: 10000 });
    }
  } catch {}

  // A05: Ladda ner Excel
  await page.getByRole('button', { name: /Ladda ner/ }).waitFor({ state: 'visible', timeout: 20000 });
  await page.getByRole('button', { name: /Ladda ner/ }).click();
  await page.waitForTimeout(2000);
  const t2 = performance.now();
  const val05 = Math.round(performance.now() - t2);
  console.log(`✅ Metric A05_LaddaNedEXCEL: ${val05}ms`);
  metrics.emit("histogram", "A05_LaddaNedEXCEL", val05);

  // Popup-funktion
  const popup = page.locator('[data-id="popup"]');
  if (await popup.isVisible({ timeout: 20000 }).catch(() => false)) {
    await page.locator('#close-popup').click();
    await popup.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  }

  // A06: Mina nedladdningar
  await page.locator('a:has-text("Start")').click();
  const t3 = performance.now();
  await page.waitForResponse(r =>
    r.url().endsWith('/users/me/watchlist') &&
    r.request().method() === 'GET' && r.status() === 200
  );
  const val06 = Math.round(performance.now() - t3);
  console.log(`✅ Metric A06_MinaNedladdningar: ${val06}ms`);
  metrics.emit("histogram", "A06_MinaNedladdningar", val06);

  // A07: Status Ladda ner knapp
  const statusTab = page.locator('.table-container').nth(1);
  await statusTab.waitFor({ state: 'visible', timeout: 30000 });

  const cell = statusTab.locator('tbody tr').first().locator('td').nth(1);
  await expect(cell).toHaveText(/I kö|Bearbetar|Redo att ladda ner/, { timeout: 10000 });

  const downloadBtn = statusTab.locator('tbody tr').first().locator('button', { hasText: 'Ladda ner' });
  const startTime = performance.now();
  let visible = await downloadBtn.isVisible().catch(() => false);
  while (!visible && (performance.now() - startTime) < 120000) {
    await page.waitForTimeout(10000);
    await page.reload();
    await statusTab.waitFor({ state: 'visible', timeout: 120000 });
    visible = await downloadBtn.isVisible().catch(() => false);
  }
  if (!visible) throw new Error('❌ Ladda ner-knappen dök aldrig upp inom 120s');
  const val07 = Math.round(performance.now() - startTime);
  console.log(`✅ Metric A07_StatusLaddaNedKnapp: ${val07}ms`);
  metrics.emit("histogram", "A07_StatusLaddaNedKnapp", val07);
}

module.exports = { oppenSökning };
