const { expect } = require("@playwright/test");

async function testLogin(page) {
  // === Steg 1: Logga in ===
  console.log("🔐 Steg 1: Loggar in användare");

  await page.goto("https://tillsynsportalentest.naturvardsverket.se/login");
  await page
    .getByRole("textbox", { name: "E-postadress" })
    .type("test1@art.se", { delay: 300 });
  await page
    .getByRole("textbox", { name: "Lösenord" })
    .type("Lösenord@123456", { delay: 300 });
  await page.getByRole("button", { name: "Logga in" }).click();
  await page
    .getByRole("textbox", { name: "Ange verifieringskoden i din" })
    .type("123456", { delay: 300 });
  await page.getByRole("button", { name: "Logga in" }).click();
}

module.exports = {
  testLogin,
};
