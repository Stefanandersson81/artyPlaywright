// tests/commands/behandlingResultat.js
const { expect } = require("@playwright/test");
const { performance } = require('perf_hooks');

/**
 * Söker behandlingsresultat och mäter responstid på API-anropet
 * @param {import('@playwright/test').Page} page
 * @param {{metrics?: {emit: (type: string, name: string, value: number) => void}}} context
 */
async function behandRES(page, context) {
  // Navigera till Behandlingsresultat-fliken
  await page.getByRole("tab", { name: "Behandlingsresultat" }).click();

  // Fyll i organisationsnummer
  const orgInput = page.getByRole("textbox", { name: "Organisationsnummer" });
  await orgInput.click();
  await orgInput.waitFor({ state: "visible" });
  await orgInput.fill("");
  await orgInput.type("5560768516", { delay: 300 });

  // Klicka på första Sök-knappen (filter år)
  await page.getByRole("button", { name: /Sök/ }).nth(0).click();

  // Välj år
  await page.locator("#franar").selectOption("2020");

  // Förbered och mät API-anrop för behandlingsresultat
  const behandPathPart = '/verksamheter/5560768516/behandlingsresultat';
  const startTime = performance.now();
  const responsePromise = page.waitForResponse(
    resp =>
      resp.url().includes(behandPathPart) &&
      resp.request().method() === 'GET' &&
      resp.status() === 200,
    { timeout: 30000 }
  );

  // Klicka på andra Sök-knappen för behandlingsresultat
  await page.getByRole("button", { name: /Sök/ }).nth(1).click();
  await responsePromise;

  // Beräkna och logga histogram-metrik
  const b07Duration = performance.now() - startTime;
  console.log(`🕑 B07_SokBehandlingsResultat: ${b07Duration.toFixed(1)} ms`);
  if (context?.metrics?.emit) {
    context.metrics.emit('histogram', 'B07_SokBehandlingsResultat', b07Duration);
  }

  // Vänta kort innan DOM-uppdatering
  await page.waitForTimeout(1000);

  // Identifiera panelen och verifiera att data laddats
  const resultPanel = page.getByRole('tabpanel', { name: 'Behandlingsresultat' });
  await expect(resultPanel).toBeVisible({ timeout: 10000 });

  // Verifiera att tabellens rubrik visas och innehåller text
  // Välj den andra rubriken om flera finns
  const heading = resultPanel
    .locator('table caption section span[role="heading"]')
    .nth(1);
  await expect(heading).toBeVisible({ timeout: 10000 });
  const headingText = await heading.innerText();
  console.log(`🏷️ Tabellrubrik: "${headingText.trim()}"`);
  expect(headingText.trim().length, 'Tabellrubriken ska innehålla minst ett tecken').toBeGreaterThan(0);
}

module.exports = {
  behandRES,
};
