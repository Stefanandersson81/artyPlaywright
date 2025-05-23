// tests/commands/login.js
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

/**
 * Genererar ett användarobjekt med randomiserad siffra i användarnamnet.
 * Exempel: perftest042@art.se
 */
function getPerfUser() {
  // Byt 100 till det antal användare du vill simulera
  const maxUsers = 100;
  const num = String(Math.floor(Math.random() * maxUsers) + 1).padStart(3, '0');
  return {
    username: `perftest${num}@art.se`,
    password: 'Password@123456'
  };
}

/**
 * Loggar in med ett dynamiskt genererat användarnamn och lösenord
 * @param {import('@playwright/test').Page} page
 */
async function testLogin(page) {
  const { username, password } = getPerfUser();
  console.log(`🔐 Loggar in som ${username}`);

  await page.goto("https://tillsynsportalentest.naturvardsverket.se/login");
  await page.locator('#username').fill(username, { delay: 300 });
  await page.locator('#password').fill(password, { delay: 300 });
  await page.locator('button:has-text("Logga in")').click();
  await page.waitForTimeout(8000);
  await page.locator('#passcode-input').fill("123456", { delay: 300 });
  await page.locator('button:has-text("Logga in")').click();
  console.log(`✅ Inloggad som ${username}`);
}

module.exports = { testLogin, getPerfUser };
