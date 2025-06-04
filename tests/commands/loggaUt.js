const { expect } = require("@playwright/test");

const withTransactionTimer = async (transactionName, events, userActions) => {
  const startedTime = Date.now();
  try {
    await userActions();
  } catch (err) {
    console.error(`❌ Fel i steg ${transactionName}:`, err);
    throw err;
  } finally {
    const difference = Date.now() - startedTime;
    if (events?.emit) {
      events.emit("histogram", transactionName, difference);
    }
  }
};


async function loggaUt(page, vuContext, events) {
  try {
    const menuButton = page.getByRole('button', { name: /Profil|PerfTest|Meny|Användare/i });
    if (await menuButton.isVisible({ timeout: 3000 })) {
      await menuButton.click();
      await page.waitForTimeout(2000); // Väntar i x sekunder
    } else {
      const allButtons = await page.getByRole('button').all();
      for (const btn of allButtons) {
        if (await btn.isVisible().catch(() => false)) {
          await btn.click();
          break;
        }
      }
    }
  } catch (err) {
    throw new Error(`❌ Kunde inte öppna användarmenyn: ${err.message}`);
  }

  await withTransactionTimer("08_LoggaUt", events, async () => {
    const logoutPromise = page.waitForResponse(resp =>
      resp.url().includes('/referencedata/notiser?notistyp=1') &&
      resp.request().method() === 'GET' &&
      resp.status() === 200,
      { timeout: 15000 }
    );

    await page.getByRole('link', { name: /Logga ut/i }).click();
    await logoutPromise;

    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page).toHaveURL(/\/login$/);
    console.log(`✅ Utloggning lyckades och redirect klar.`);
  });
    await page.waitForTimeout(10000); // Väntar i x sekunder

}

module.exports = { loggaUt };
