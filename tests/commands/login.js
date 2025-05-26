// tests/commands/login.js

const { performance } = require('perf_hooks');

/**
 * Genererar en slumpmässig testanvändare
 */
function getSingleUser() {
  const maxUsers = 100;
  const num = String(Math.floor(Math.random() * maxUsers) + 1).padStart(3, '0');
  return {
    username: `perftest${num}@art.se`,
    password: 'Password@123456'
  };
}

/**
 * Kör login och loggar svarstider mot
 * /auth/login och /auth/2fa/verify
 */
async function testLogin(page, context) {
  const { username, password } = getSingleUser();
  console.log(`🔐 Loggar in som ${username}`);

  // Navigera till login-sidan
  await page.goto("https://tillsynsportalentest.naturvardsverket.se/login");

  // Fyll i formuläret
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(password);

  // Mät /auth/login
  const loginPromise = page.waitForResponse(resp =>
    resp.url().endsWith('/auth/login') &&
    resp.request().method() === 'POST' &&
    resp.status() === 200
  );
  const loginStart = performance.now();
  await page.locator('button:has-text("Logga in")').click();
  await loginPromise;
  const loginMs = performance.now() - loginStart;
  console.log(`🕑 /auth/login svarstid: ${loginMs.toFixed(1)} ms`);
  if (context?.metrics?.emit) {
    context.metrics.emit('histogram', 'loginTime', loginMs);
  }

  // Fyll i 2FA-koden
  await page.locator('#passcode-input').fill('123456');

  // Mät /auth/2fa/verify
  const verifyPromise = page.waitForResponse(resp =>
    resp.url().endsWith('/auth/2fa/verify') &&
    resp.request().method() === 'POST' &&
    resp.status() === 200
  );
  const verifyStart = performance.now();
  await page.locator('button:has-text("Logga in")').click();
  await verifyPromise;
  const verifyMs = performance.now() - verifyStart;
  console.log(`🕑 /auth/2fa/verify svarstid: ${verifyMs.toFixed(1)} ms`);
  if (context?.metrics?.emit) {
    context.metrics.emit('histogram', 'MFAVerifyTime', verifyMs);
  }

  console.log(`✅ Inloggad som ${username}`);
}

module.exports = { testLogin, getSingleUser };