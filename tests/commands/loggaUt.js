// loggaUt.js – robust hantering av användarmeny
const { expect } = require("@playwright/test");

/**
 * Loggar ut från portalen utan att behöva ange användarnamn.
 * @param {import('@playwright/test').Page} page 
 */
async function loggaUt(page) {
  try {
    // Försök hitta en menyknapp som brukar innehålla användaren
    // (t.ex. Profil, Testare, Meny, Användare, eller avatar)
    const menuButton = await page.getByRole('button', { name: /Profil|PerfTest|Meny|Användare/i });

    if (await menuButton.isVisible()) {
      await menuButton.click();
    } else {
      // Fallback: klicka på första synliga menyknapp
      const allButtons = await page.getByRole('button').all();
      for (const btn of allButtons) {
        if (await btn.isVisible()) {
          await btn.click();
          break;
        }
      }
    }

    await page.getByRole('link', { name: /Logga ut/i }).click();
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page).toHaveURL(/\/login$/);
    console.log(`✅ Utloggning lyckades.`);
  } catch (err) {
    throw new Error(`❌ Misslyckades med utloggning: ${err.message}`);
  }
}

module.exports = {
  loggaUt,
};
