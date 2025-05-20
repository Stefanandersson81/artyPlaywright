// login.js – robust inloggning med tydlig felhantering
const { expect } = require("@playwright/test");

/**
 * Loggar in en användare med angivna uppgifter
 * @param {import('@playwright/test').Page} page
 * @param {string} username
 * @param {string} password
 */
async function testLogin(page, username, password) {
  if (!username || !password) {
    throw new Error(`❌ testLogin saknar indata: username="${username}", password="${password}"`);
  }

  console.log(`🔐 Försöker logga in som ${username}`);

  try {
    await page.goto("https://tillsynsportalentest.naturvardsverket.se/login");

    await page.getByRole("textbox", { name: /E-postadress/i }).fill(username,{ delay: 300 });
    await page.getByRole("textbox", { name: /Lösenord/i }).fill(password,{ delay: 300 });
    await page.getByRole("button", { name: /Logga in/i }).click();
await page.waitForTimeout(8000)
    // Hantera ev. tvåfaktorsida (testkod)
    const kodfält = page.getByRole("textbox", { name: /verifieringskoden/i });
    if (await kodfält.isVisible()) {
      await kodfält.fill("123456",{ delay: 300 });
      await page.getByRole("button", { name: /Logga in/i }).click();
    }

    // Verifiera att vi är inloggade
    await expect(page).not.toHaveURL(/\/login$/);
    console.log(`✅ Inloggad som ${username}`);
  } catch (error) {
    throw new Error(`❌ Inloggning misslyckades för ${username}: ${error.message}`);
  }
}

module.exports = {
  testLogin,
};