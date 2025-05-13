const { expect } = require('@playwright/test');

async function testLogin(page) {
  await page.goto("https://tillsynsportalentest.naturvardsverket.se/login");

  await page.getByRole("textbox", { name: "E-postadress" }).click();
  await page
    .getByRole("textbox", { name: "E-postadress" })
    .type("test1@art.se", { delay: 300 });

  await page.getByRole("textbox", { name: "Lösenord" }).click();
  await page
    .getByRole("textbox", { name: "Lösenord" })
    .type("Lösenord@123456", { delay: 300 });

  await page.getByRole("button", { name: "Logga in" }).click();
  await page.waitForTimeout(4000);

  await page
    .getByRole("textbox", { name: "Ange verifieringskoden i din" })
    .type("123456", { delay: 300 });
  await page.getByRole("button", { name: "Logga in" }).click();

  await page.getByRole("button", { name: "Utsökning rapporter" }).click();
  await page.getByRole("link", { name: "Sök verksamhet" }).click();

  const orgInput = page.getByRole("textbox", { name: "Organisationsnummer" });
  await page.getByRole("textbox", { name: "Organisationsnummer" }).click();
  await orgInput.waitFor({ state: "visible" });
  await orgInput.type("5560768516", { delay: 100 });

  await page
    .locator("header")
    .filter({ hasText: "Sök verksamhet" })
    .getByRole("button")
    .click();
  await page.waitForTimeout(5000);

  const firstRow = page.locator("table tbody tr").first();
  await expect(firstRow).toBeVisible();
  await expect(firstRow).not.toHaveText("");
  await firstRow.click();

  await expect(page.locator('[data-id="popup"]')).toBeVisible();
  await expect(
    page.getByLabel("Verksamhetsinformation").locator("section").filter({
      hasText:
        "Senaste rapporterade uppgifter = Rapport uppdaterad = Rapport försenadRapport",
    })
  ).toBeVisible();
  await expect(page.locator("#verksamhetsutovare")).toContainText("5560768516");

  await page.waitForSelector("#close-popup", { state: "visible", timeout: 5000 });
  await page.click("#close-popup");
  await page.waitForTimeout(5000);

  await page.getByRole("textbox", { name: "Organisationsnummer" }).fill("");
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
  await page.waitForTimeout(5000);
  await expect(page.locator('[data-id="popup"]')).toBeVisible();
  await expect(
    page.getByLabel("Verksamhetsinformation").locator("section").filter({
      hasText:
        "Senaste rapporterade uppgifter = Rapport uppdaterad = Rapport försenadRapport",
    })
  ).toBeVisible();
  await expect(page.locator("#verksamhetsutovare")).toContainText("5567699490");

  await page.waitForSelector("#close-popup", { state: "visible", timeout: 5000 });
  await page.click("#close-popup");

  await page.getByRole("textbox", { name: "Organisationsnummer" }).click();
  await page.getByRole("textbox", { name: "Organisationsnummer" }).fill("");
  await page
    .getByRole("textbox", { name: "Organisationsnummer" })
    .type("843002570", { delay: 300 });

  await page
    .locator("header")
    .filter({ hasText: "Sök verksamhet" })
    .getByRole("button")
    .click();

  await expect(page.locator("#form-error-getantalrapporter")).toHaveText(
    "Denna verksamhet har ännu inte rapporterat, men du kan välja att bevaka den ändå under Organisationsuppgifter."
  );
}

module.exports = {
  testLogin,
};
