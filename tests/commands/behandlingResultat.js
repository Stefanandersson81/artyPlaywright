const { expect } = require("@playwright/test");

const withTransactionTimer = async (transactionName, events, userActions) => {
  const startedTime = Date.now();
  try {
    await userActions();
  } catch (err) {
    console.error(`❌ Fel i steg ${transactionName}:`, err);
    throw err;
  } finally {
    const duration = Date.now() - startedTime;
    events.emit("histogram", transactionName, duration);
  }
};

async function behandRES(page, vuContext, events) {
  const behandPathPart = "/verksamheter/5560768516/behandlingsresultat";

  await page.getByRole("button", { name: "Utsökning rapporter" }).click();
  await page.getByRole("link", { name: "Sök verksamhet" }).click();

  const orgInput = page.getByRole("textbox", { name: "Organisationsnummer" });
  await orgInput.waitFor({ state: "visible", timeout: 10000 });
  await orgInput.click();
  await orgInput.fill("");
  await orgInput.type("5560768516", { delay: 300 });

  await page.locator("header").filter({ hasText: "Sök verksamhet" }).getByRole("button").click();

  await page.getByRole("tab", { name: "Kopplingar verksamhet" }).click();
  await page.getByRole("tab", { name: "Behandlingsresultat" }).click();

  const orgInput1 = page.getByRole("textbox", { name: "Organisationsnummer" });
  await orgInput1.waitFor({ state: "visible", timeout: 10000 });
  await orgInput1.click();
  await orgInput1.fill("");
  await orgInput1.type("5560768516", { delay: 300 });

  await page.getByRole("button", { name: /Sök/ }).nth(0).click();

  await page.locator("#franar").selectOption("2020");

  await withTransactionTimer("B07_SokBehandlingsResultat", events, async () => {
    const responsePromise = page.waitForResponse(
      resp =>
        resp.url().includes(behandPathPart) &&
        resp.request().method() === "GET" &&
        resp.status() === 200,
      { timeout: 30000 }
    );

    await page.getByRole("button", { name: /Sök/ }).nth(1).click();
    await responsePromise;
  });

  await page.waitForTimeout(1000);

  const resultPanel = page.getByRole("tabpanel", { name: "Behandlingsresultat" });
  await expect(resultPanel).toBeVisible({ timeout: 10000 });

  const heading = resultPanel
    .locator("table caption section span[role='heading']")
    .nth(1);

  await expect(heading).toBeVisible({ timeout: 10000 });

  const headingText = await heading.innerText();
  console.log(`🏷️ Tabellrubrik: "${headingText.trim()}"`);
  expect(headingText.trim().length).toBeGreaterThan(0);
}

module.exports = {
  behandRES,
};
