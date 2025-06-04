const { expect } = require('@playwright/test');

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
      events.emit('histogram', transactionName, difference);
    }
  }
};


function getSingleUser() {
  const maxUsers = 100;
  const num = String(Math.floor(Math.random() * maxUsers) + 1).padStart(3, '0');
  return {
    username: `perftest${num}@art.se`,
    password: 'Password@123456',
  };
}

async function Inloggning(page, vuContext, events, test) {
  const user = vuContext?.vars?.user || getSingleUser();
  const { username, password } = user;

  console.log(`🔐 Loggar in som ${username}`);

  await page.goto("https://tillsynsportalentest.naturvardsverket.se/login");
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(password);

  const loginPromise = page.waitForResponse(resp =>
    resp.url().endsWith('/auth/login') &&
    resp.request().method() === 'POST' &&
    resp.status() === 200
  );
  await page.locator('button:has-text("Logga in")').click();
  await loginPromise;
  await page.waitForTimeout(8000); // Väntar i x sekunder

  await page.locator('#passcode-input').fill('123456');

  await withTransactionTimer("02_LoginStep", events, async () => {
    const verifyPromise = page.waitForResponse(resp =>
      resp.url().endsWith('/auth/2fa/verify') &&
      resp.request().method() === 'POST' &&
      resp.status() === 200
    );
    await page.locator('button:has-text("Logga in")').click();
    await verifyPromise;
    await expect(page.getByRole('link', { name: 'E-tjänst Tillsynsportalen' })).toBeVisible();
  });

}

module.exports = { 
  Inloggning,
  getSingleUser,
};
