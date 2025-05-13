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

  // === Steg 2: Sök verksamhet och fyll i första orgnummer ===
  console.log("📄 Steg 2: Fyller i första organisationsnummer");

  await page.getByRole("button", { name: "Utsökning rapporter" }).click();
  await page.getByRole("link", { name: "Sök verksamhet" }).click();

  const orgInput = page.getByRole("textbox", { name: "Organisationsnummer" });
  await orgInput.click();
  await orgInput.waitFor({ state: "visible" });
  await orgInput.type("5560768516", { delay: 100 });

  await page
    .locator("header")
    .filter({ hasText: "Sök verksamhet" })
    .getByRole("button")
    .click();

  const firstRow = page.locator("table tbody tr").first();
  await expect(firstRow).toBeVisible();
  await expect(firstRow).not.toHaveText("");
  await firstRow.click();

  console.log("✅ Verifierar popup och verksamhetsinfo (1)");

  await page.waitForSelector('[data-id="popup"]', { state: "visible" });
  await page.waitForSelector("#verksamhetsutovare", { state: "visible" });
  await expect(page.locator("#verksamhetsutovare")).toContainText("5560768516");

  await page.waitForSelector("#close-popup", {
    state: "visible",
    timeout: 5000,
  });
  await page.click("#close-popup");
  await page.waitForTimeout(5000);

  // === Steg 3: Andra orgnummer ===
  console.log("📄 Steg 3: Fyller i andra organisationsnummer");

  await orgInput.fill("");
  await orgInput.waitFor({ state: "visible" });
  await orgInput.type("5567699490", { delay: 200 });
  await page
    .locator("header")
    .filter({ hasText: "Sök verksamhet" })
    .getByRole("button")
    .click();
    await page.waitForTimeout(2000);
  const secondRow = page.locator("table tbody tr").first();
  await expect(secondRow).toBeVisible();
  await expect(secondRow).not.toHaveText("");
  await secondRow.click();

  console.log("✅ Verifierar popup och verksamhetsinfo (2)");

  await page.waitForSelector('[data-id="popup"]', { state: "visible" });
  await page.waitForSelector("#verksamhetsutovare", { state: "visible" });
  await expect(page.locator("#verksamhetsutovare")).toContainText("5567699490");

  await page.waitForSelector("#close-popup", {
    state: "visible",
    timeout: 5000,
  });
  await page.click("#close-popup");

  // === Steg 4: Tredje orgnummer utan rapport ===
  console.log("🚫 Steg 4: Verifierar att inget rapporterat finns");

  await orgInput.click();
  await orgInput.fill("");
  await orgInput.type("843002570", { delay: 300 });

  await page
    .locator("header")
    .filter({ hasText: "Sök verksamhet" })
    .getByRole("button")
    .click();

  await expect(page.locator("#form-error-getantalrapporter")).toHaveText(
    "Denna verksamhet har ännu inte rapporterat, men du kan välja att bevaka den ändå under Organisationsuppgifter."
  );

  console.log("🏁 Testet slutfört");
}

module.exports = {
  testLogin,
};
