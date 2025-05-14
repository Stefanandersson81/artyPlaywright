const { expect } = require("@playwright/test");

async function loggaUt(page) {
await page.getByRole('button', { name: /Testare Ett/ }).click();
await page.getByRole('link', { name: /Logga ut/i }).click();
await page.waitForURL('**/login', { timeout: 10000 });
await expect(page).toHaveURL('https://tillsynsportalentest.naturvardsverket.se/login');
console.log("✅ Logga ut-funktionen fungerade, och login-sidan är visad.");
}

module.exports = {
  loggaUt,
};
