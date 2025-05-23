const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const { expect } = require("@playwright/test");

/**
 * Läser in användare från CSV och återanvänder dem i tur och ordning
 */
let users = null;
let userIndex = 0;
function loadUsers() {
  if (!users) {
    const csvPath = path.join(__dirname, "../fixtures/data.csv");
    const csvContent = fs.readFileSync(csvPath, "utf8");
    users = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    }).map(user => {
      const trimmed = {};
      for (const key in user) {
        trimmed[key.trim().replace(/^\uFEFF/, '')] = user[key];
      }
      return trimmed;
    });
  }
  return users;
}
function getNextUser() {
  const userList = loadUsers();
  const user = userList[userIndex % userList.length];
  userIndex++;
  return user;
}

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

    await page.getByRole("textbox", { name: /E-postadress/i }).fill(username, { delay: 300 });
    await page.getByRole("textbox", { name: /Lösenord/i }).fill(password, { delay: 300 });
    await page.getByRole("button", { name: /Logga in/i }).click();
    await page.waitForTimeout(8000);
    // Hantera ev. tvåfaktorsida (testkod)
    const kodfält = page.getByRole("textbox", { name: /verifieringskoden/i });
    if (await kodfält.isVisible()) {
      await kodfält.fill("123456", { delay: 300 });
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
  getNextUser,
};