// @ts-check
const { test, expect } = require('@playwright/test');
const { testLogin, getNextUser } = require('./commands/login');
const { sokKopplingar } = require('./commands/sokKopplingar');
const { behandRES } = require('./commands/behandlingResultat');
const { oppenSökning } = require('./commands/oppenSökning');
const { loggaUt } = require('./commands/loggaUt');
const { sokOrg } = require('./commands/sokOrg');
const { sokOmbud } = require('./commands/sokOmbud');

test.describe('Återanvända användare från commands/login', () => {
  for (let i = 0; i < 2; i++) { // Kör två varv, eller så många du vill
    test(`1. ÖPPEN SÖK – iteration ${i + 1}`, async ({ page }) => {
      const user = getNextUser();
      await testLogin(page, user.username, user.password);
      await oppenSökning(page);
      await loggaUt(page, user.username);
    });

    test(`2. SÖK verksamhet – iteration ${i + 1}`, async ({ page }) => {
      const user = getNextUser();
      await testLogin(page, user.username, user.password);
      await sokOrg(page);
      await sokKopplingar(page);
      await behandRES(page);
      await sokOmbud(page);
      await loggaUt(page, user.username);
    });

    test.skip(`3. loggar In och Loggar Ut – iteration ${i + 1}`, async ({ page }) => {
      const user = getNextUser();
      await testLogin(page, user.username, user.password);
      await page.waitForTimeout(8000);
      await loggaUt(page, user.username);
    });
  }
});
