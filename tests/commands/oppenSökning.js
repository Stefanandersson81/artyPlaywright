const { expect } = require("@playwright/test");
const path = require('path');
const { readOrgNumFromCSV } = require('../utils/randomOrg');

let orgListPromise;
async function getOrgList() {
  if (!orgListPromise) {
    const csvPath = path.join(__dirname, '../fixtures/organisationsNummer.csv');
    orgListPromise = readOrgNumFromCSV(csvPath);
  }
  return orgListPromise;
}

async function oppenSökning(page) {
  console.log('📄 Steg 2: Hämtar organisationsnummer från CSV...');
  const orgList = await getOrgList();
  if (!orgList.length) {
    throw new Error('Inga organisationsnummer hittades i CSV-filen');
  }

  // Välj ett organisationsnummer (t.ex. slumpmässigt)
  const randomIndex = Math.floor(Math.random() * orgList.length);
  const record = orgList[randomIndex];
  const orgNum = record.orgnummer || record.OrgNumber || record['orgnummer'] || record['OrgNumber'];
  console.log(`▶️ Använder orgnummer: ${orgNum}`);


  await page.getByRole("button", { name: "Utsökning rapporter" }).click();
  await page.getByRole("link", { name: "Öppen sökning" }).click();

  const orgInput = page.getByRole("textbox", { name: "organisationsnummer" });
  await orgInput.click();
  await orgInput.waitFor({ state: "visible" });
  await orgInput.type(orgNum);
//större tids spann,
  await page.locator("#datefrom").fill("2020-04-11");
  await page.getByRole("button", { name: /Sök/ }).nth(0).click();
//

  // --- Sätt in här, direkt efter att du verifierat att rader finns ---
  const pagination = page.locator('.pagination span').first();
  await expect(pagination).toBeVisible({ timeout: 30_000 });

  // Exempeltext: "1 – 10 av 10339956"
  const paginationText = await pagination.innerText();
  console.log('🔢 Pagination-text:', paginationText);

  // Plocka ut siffrorna efter "av"
  const match = paginationText.match(/av\s*([\d\s]+)/i);
  if (!match) {
    throw new Error(`Kunde inte läsa ut totala antalet från pagination-texten: "${paginationText}"`);
  }
  const antalExcel = parseInt(match[1].replace(/\s/g, ''), 10);
  const minstAntal  = 20000;

  if (antalExcel >= minstAntal) {
    console.log(`✅ Totalt antal poster (${antalExcel}) är ≥ ${minstAntal}`);
    await page.locator("#kommunkod").fill("0100 - Stockholms län");
  await page.getByRole("button", { name: /Sök/ }).nth(0).click();
  const row = page.locator("table tbody tr").first();
  await expect(row).toBeVisible();
  //await expect(row).not.toHaveText("");
  } 
  else {
  const rows = page.locator("table tbody tr").first();
  await expect(rows).toBeVisible();

  await page.getByRole("button", { name: /Ladda ner/ }).click();
  await expect(page.locator('[data-id="popup"]')).toBeVisible({
    timeout: 10000,
  });
    //throw new Error(`❌ För få poster: ${antalExcel} < ${minstAntal}`);
  }
  // lägg till filter för kommun 0184 - Solna
  
  
/*
  await page
    .locator("#anteckningstyp")
    .selectOption({ label: "Avfallsproducent" }); //står för 50% av alla anteckningar, transportör är också stor
  await page.getByRole("button", { name: /Sök/ }).nth(0).click();
  const rows = page.locator("table tbody tr").first();
  await expect(rows).toBeVisible();
  //await expect(rows).not.toHaveText("");
/*
  await page.getByRole("button", { name: /Ladda ner/ }).click();
  await expect(page.locator('[data-id="popup"]')).toBeVisible({
    timeout: 10000,
  });
  */

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

//reload-loop för att vänta på "Bearbetar"  //class="loader"
const maxTimeoutMs = 120000;
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

  // Acceptera antingen "Bearbetar" eller "Redo att ladda ner"
  await expect(nyStatusCell).toContainText(/Bearbetar|Redo att ladda ner/, { timeout: 2000 });

  const text = await nyStatusCell.innerText();
  console.log(`✅ Status har uppdaterats till "${text.trim()}"`);
  hittat = true;
  break;
} catch (e) {
  // Hantera timeout eller annan felaktig status
  console.log('⏳ Väntar fortfarande på korrekt status…');
}

}
//

if (!hittat) {
  throw new Error('❌ Timeout – status blev aldrig "Bearbetar" inom 60 sek');
}

}

module.exports = {
  oppenSökning,
};
