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

async function sokKopplingar(page, vuContext, events) {
  
    const rapportBtn = page.getByRole("button", { name: "Utsökning rapporter" });
    await rapportBtn.waitFor({ state: "visible", timeout: 10000 });
    await rapportBtn.click();

    const sokVerksamhetLink = page.getByRole("link", { name: "Sök verksamhet" });
    await sokVerksamhetLink.waitFor({ state: "visible", timeout: 10000 });
    await sokVerksamhetLink.click();

    const orgInput = page.getByRole("textbox", { name: "Organisationsnummer" });
    await orgInput.waitFor({ state: "visible", timeout: 10000 });
    await orgInput.click();
    await orgInput.fill("");
    await orgInput.type("5560768516", { delay: 300 });

    const sokBtn = page.locator("header").filter({ hasText: "Sök verksamhet" }).getByRole("button");
    await sokBtn.waitFor({ state: "visible", timeout: 10000 });
    await sokBtn.click();

    const tab = page.getByRole("tab", { name: "Kopplingar verksamhet" });
    await tab.waitFor({ state: "visible", timeout: 10000 });
    await tab.click();

    const tabPanel = page.getByRole("tabpanel", { name: "Kopplingar verksamhet" });

    const dropdown = tabPanel.locator("#selectedkopplingstyp");
    await expect(dropdown).toBeVisible({ timeout: 10000 });
    await dropdown.selectOption({ label: "Adresser" });

    const anteckningDropdown = tabPanel.locator("#selectedanteckningstyp");
    await expect(anteckningDropdown).toBeVisible({ timeout: 10000 });
    await anteckningDropdown.selectOption({ label: "Alla" });

    const dateFrom = tabPanel.locator("#datefrom");
    await dateFrom.waitFor({ state: "visible", timeout: 10000 });
    await dateFrom.fill("");
    await dateFrom.fill("2020-04-22", { delay: 300 });
  await withTransactionTimer("B06_SokKopplingarVerksamhet", events, async () => {
    const pathPart = "/verksamheter/5560768516/kopplingar/adresser";
    const responsePromise = page.waitForResponse(
      resp =>
        resp.url().includes(pathPart) &&
        resp.request().method() === "GET" &&
        resp.status() === 200,
      { timeout: 30000 }
    );

    const andraSokBtn = page.getByRole("button", { name: /Sök/ }).nth(1);
    await andraSokBtn.waitFor({ state: "visible", timeout: 10000 });
    await andraSokBtn.click();
    await responsePromise;

    const addressTable = tabPanel.locator("table tbody tr");
    await addressTable.first().waitFor({ state: "visible", timeout: 10000 });

    const text = await addressTable.first().innerText();
    console.log(`🏷️ Första radens innehåll: "${text.trim()}"`);
    expect(text.trim().length).toBeGreaterThan(0);
  });
}

module.exports = { sokKopplingar };
