const { expect } = require("@playwright/test");
const path = require("path");
const { readOrgNumFromCSV } = require("../utils/randomOrg");
const { sokPagination } = require("../utils/sokPagination");

let orgListCache = null;
async function getOrgList() {
  if (!orgListCache) {
    const csvPath = path.join(__dirname, "../fixtures/organisationsNummer.csv");
    orgListCache = await readOrgNumFromCSV(csvPath);
  }
  return orgListCache;
}

async function oppenSökning(page) {
  console.log("📄 Steg 2: Hämtar organisationsnummer från CSV...");

  const orgList = await getOrgList();
  if (!Array.isArray(orgList) || orgList.length === 0) {
    throw new Error('Inga organisationsnummer hittades i CSV-filen');
  }

  // Välj ett organisationsnummer (slumpmässigt)
  const randomIndex = Math.floor(Math.random() * orgList.length);
  const record = orgList[randomIndex];
  const orgNum =
    record.orgnummer ||
    record.OrgNumber ||
    record["orgnummer"] ||
    record["OrgNumber"];
  console.log(`▶️ Använder orgnummer: ${orgNum}`);

  await page.getByRole("button", { name: "Utsökning rapporter" }).click();
  await page.getByRole("link", { name: "Öppen sökning" }).click();

  const orgInput = page.getByRole("textbox", { name: "organisationsnummer" });
  await orgInput.click();
  await orgInput.waitFor({ state: "visible" });
  await orgInput.type(orgNum);
  await page.locator("#datefrom").fill("2020-04-11");
  await page.getByRole("button", { name: /Sök/ }).nth(0).click();
  await page.waitForTimeout(2000);
  await sokPagination(page);

  // Popup-hantering
  const popup = page.locator('[data-id="popup"]');
  if (await popup.isVisible()) {
    await page.locator("#close-popup").click();
    await expect(popup).toBeHidden({ timeout: 5000 });
  }
  await page.getByRole("link", { name: "Start" }).click();

  // Statushantering
  const andraTabellen = page.locator(".table-container").nth(1);
  await expect(andraTabellen).toBeVisible();

  const förstaRaden = andraTabellen.locator("tbody tr").first();
  await expect(förstaRaden).toBeVisible();

  const statusCell = förstaRaden.locator("td").nth(1); // kolumn 2 = status
  const statusText = (await statusCell.innerText()).trim();

  if (statusText === "I kö") {
    console.log('✅ Status är "I kö"');
  } else if (/Bearbetar|Redo att ladda ner/.test(statusText)) {
    console.log(`✅ Status är "${statusText}"`);
  } else {
    throw new Error(`❌ Ovänat statusvärde: "${statusText}"`);
  }

  // Om status är "I kö", vänta på "Bearbetar" eller "Redo att ladda ner"
  if (statusText === "I kö") {
    const maxTimeoutMs = 120000;
    const startTime = Date.now();
    let hittat = false;

    while (Date.now() - startTime < maxTimeoutMs) {
      await page.waitForTimeout(5000);
      await page.reload();
      console.log("🔄 Sida reloadad");

      const nyTabell = page.locator(".table-container").nth(1);
      const nyRad = nyTabell.locator("tbody tr").first();
      const nyStatusCell = nyRad.locator("td").nth(1);

      try {
        await expect(nyRad).toBeVisible({ timeout: 3000 });
        const nyStatusText = (await nyStatusCell.innerText()).trim();

        if (/Bearbetar|Redo att ladda ner/.test(nyStatusText)) {
          console.log(`✅ Status har uppdaterats till "${nyStatusText}"`);
          hittat = true;
          break;
        } else {
          console.log(`⏳ Status är fortfarande "${nyStatusText}"`);
        }
      } catch (e) {
        console.log("⏳ Väntar fortfarande på korrekt status…");
      }
    }

    if (!hittat) {
      throw new Error('❌ Timeout – status blev aldrig "Bearbetar" eller "Redo att ladda ner" inom 120 sek');
    }
  }
}

module.exports = {
  oppenSökning,
};
