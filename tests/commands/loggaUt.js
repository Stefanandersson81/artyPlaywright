// loggaUt.js – robust hantering av användarmeny
const { expect } = require("@playwright/test");

/**
 * Loggar ut från portalen baserat på dynamiskt användarnamn
 * @param {import('@playwright/test').Page} page 
 * @param {string} username - Ex: test1@art.se
 */
async function loggaUt(page, username = '') {
  try {
    // Försök hitta användarmenyn via e-postprefix
    const namnPrefix = username.split('@')[0];
    const menuButton = await page.getByRole('button', { name: new RegExp(namnPrefix, 'i') });

    if (await menuButton.isVisible()) {
      await menuButton.click();
    } else {
      // fallback: försök med generiska menyknappar
      await page.getByRole('button', { name: /Profil|Testare|Meny|Användare/i }).click();
    }

    await page.getByRole('link', { name: /Logga ut/i }).click();
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page).toHaveURL(/\/login$/);
    console.log(`✅ ${username} loggades ut.`);
  } catch (err) {
    throw new Error(`❌ Misslyckades med utloggning för ${username}: ${err.message}`);
  }
}

module.exports = {
  loggaUt,
};
