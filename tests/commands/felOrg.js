const { expect } = require("@playwright/test");

async function felOrg(page) {
  // === Steg 4: Tredje orgnummer utan rapport ===
  console.log("🚫 Steg 4: Verifierar att inget rapporterat finns");
  const orgInput = page.getByRole("textbox", { name: "Organisationsnummer" });
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
    felOrg,
};
