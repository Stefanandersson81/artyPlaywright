const { expect } = require("@playwright/test");
const path = require("path");
const { performance } = require("perf_hooks");
const { readOrgNumFromCSV } = require("../utils/randomOrg");

const withTransactionTimer = async (transactionName, events, userActions) => {
  const startedTime = Date.now();
  try {
    await userActions();
  } catch (err) {
    console.error(`❌ Fel i steg ${transactionName}:`, err);
    throw err;
  } finally {
    const difference = Date.now() - startedTime;
    if (events?.emit) {
      events.emit('histogram', transactionName, difference);
    }
  }
};


async function oppenSökning(page, vuContext, events, test) {
  console.log("📄 Hämtar organisationsnummer…");
  const orgs = await readOrgNumFromCSV(path.join(__dirname, "../fixtures/organisationsNummer.csv"));
  if (!orgs.length) throw new Error("Inga organisationsnummer i CSV");

  const orgNum = orgs[Math.floor(Math.random() * orgs.length)].orgnummer;
  console.log(`▶️ Använder ${orgNum}`);

  await page.locator('button:has-text("Utsökning rapporter")').click();
  await page.locator('a:has-text("Öppen sökning")').click();

  const base = 'https://tillsynsportalenapitestidentity.naturvardsverket.se/referencedata';
  const endpoints = ['avfallstyper', 'omraden'].map(endpoint =>
    page.waitForResponse(r => r.url() === `${base}/${endpoint}` && r.status() === 200)
  );
  await Promise.all(endpoints);

  await page.locator("#organisationsnummer").fill(orgNum, { delay: 400 });
  await page.locator("input#datefrom").fill("2020-04-11");
  await page.waitForTimeout(3000);

  await withTransactionTimer("A04_OppenSokning", events, async () => {
    await page.locator('button[type="submit"]', { hasText: 'Sök' }).first().click();
    await page.waitForResponse(
      r =>
        r.url().endsWith("/anteckningar/search/advanced") &&
        r.request().method() === "POST" &&
        r.status() === 200,
      { timeout: 60000 }
    );
  });

  const pag = page.locator(".pagination span").first();
  let paginationExists = false;
  let count = 0;

  try {
    await pag.waitFor({ state: "visible", timeout: 10000 });
    const inner = await pag.innerText();
    const match = inner.match(/av\s*([\d\s]+)/i);
    if (match) {
      count = parseInt(match[1].replace(/\s/g, ""), 10);
      paginationExists = true;
    }
  } catch {
    console.log("ℹ️ Ingen pagination synlig – antagligen få träffar.");
  }

  if (paginationExists && count >= 20000) {
    let stepNum = 0;

    while (count >= 20000) {
      stepNum++;
      if (stepNum === 1) {
        await page.locator("input#kommunkod").fill("0100 - Stockholms län", { delay: 400 });
        await page.locator("#options-kommunkod").click();
      } else if (stepNum === 2) {
        await page.locator("#anteckningstyp").selectOption({ label: "Avfallsproducent" });
      } else {
        throw new Error("❌ För många träffar trots alla filtersteg!");
      }

      await page.locator('button[type="submit"]', { hasText: 'Sök' }).first().click();

      try {
        await pag.waitFor({ state: "visible", timeout: 12000 });
        const inner = await pag.innerText();
        const match = inner.match(/av\s*([\d\s]+)/i);
        if (match) {
          count = parseInt(match[1].replace(/\s/g, ""), 10);
        } else {
          console.log("⚠️ Kunde inte tolka antalet träffar efter filter.");
          break;
        }
      } catch {
        console.log("ℹ️ Pagination försvann efter filter – går vidare.");
        break;
      }
    }
  }

  const firstRow = page.locator("tbody tr").first();
  await firstRow.waitFor({ state: "visible", timeout: 10000 });
  //await firstRow.click();

  await page.waitForTimeout(5000);

  await withTransactionTimer("A05_LaddaNedExcel", events, async () => {
    const button = page.getByRole("button", { name: /Ladda ner/ });
    await button.waitFor({ state: "visible", timeout: 20000 });
    await button.click();
  });

  await page.waitForTimeout(2000);

  const popup = page.locator('[data-id="popup"]');
  if (await popup.isVisible({ timeout: 20000 }).catch(() => false)) {
    await page.locator("#close-popup").click();
    await popup.waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});
  }

  await withTransactionTimer("A06_MinaNedladdningar", events, async () => {
    await page.locator('a:has-text("Start")').click();
    await page.waitForResponse(
      r =>
        r.url().endsWith("/users/me/watchlist") &&
        r.request().method() === "GET" &&
        r.status() === 200,
      { timeout: 60000 }
    );
  });

  await page.waitForTimeout(3000);

  await withTransactionTimer("A07_StatusLaddaNerKnapp", events, async () => {
    const statusTab = page.locator(".table-container").nth(1);
    await statusTab.waitFor({ state: "visible", timeout: 30000 });

    const downloadBtn = statusTab.locator("tbody tr").first().locator("button", { hasText: "Ladda ner" });

    const start = Date.now();
    let visible = await downloadBtn.isVisible().catch(() => false);

    while (!visible && (Date.now() - start) < 120000) {
      await page.waitForTimeout(10000);
      await page.reload();
      await statusTab.waitFor({ state: "visible", timeout: 30000 });
      visible = await downloadBtn.isVisible().catch(() => false);
    }

    if (!visible) throw new Error("❌ Ladda ner-knappen dök aldrig upp inom 120s");
  });
}

module.exports = { oppenSökning };
