// tests/commands/loggaUt.js
const { expect } = require("@playwright/test");
const { performance } = require('perf_hooks');

/**
 * Loggar ut från portalen och mäter svarstid på utloggningsanropet
 * @param {import('@playwright/test').Page} page 
 * @param {{metrics?: {emit: (type: string, name: string, value: number) => void}}} context
 */
async function loggaUt(page, context) {
  try {
    // Klicka på användarmenyn
    const menuButton = await page.getByRole('button', { name: /Profil|PerfTest|Meny|Användare/i });
    if (await menuButton.isVisible()) {
      await menuButton.click();
    } else {
      const allButtons = await page.getByRole('button').all();
      for (const btn of allButtons) {
        if (await btn.isVisible()) {
          await btn.click();
          break;
        }
      }
    }

    // Förbered mätning av GET /referencedata/notiser?notistyp=1
    const logoutPromise = page.waitForResponse(resp =>
      resp.url().includes('/referencedata/notiser?notistyp=1') &&
      resp.request().method() === 'GET' &&
      resp.status() === 200
    );
    const start = performance.now();

    // Klicka på "Logga ut"
    await page.getByRole('link', { name: /Logga ut/i }).click();
    // Vänta på att anropet slutförs
    await logoutPromise;
    // Vänta på att redirect till login-sida är klar
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page).toHaveURL(/\/login$/);

    // Beräkna och logga svarstid
    const duration = performance.now() - start;
    console.log(`🕑 /referencedata/notiser?notistyp=1 svarstid vid utloggning: ${duration.toFixed(1)} ms`);
    if (context?.metrics?.emit) {
      context.metrics.emit('histogram', '08_LoggaUt', duration);
    }

    console.log(`✅ Utloggning lyckades.`);
  } catch (err) {
    throw new Error(`❌ Misslyckades med utloggning: ${err.message}`);
  }
}

module.exports = { loggaUt };
