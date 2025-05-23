// @ts-check
const { test, expect } = require('@playwright/test');
const { testLogin } = require('./commands/login');
const { sokKopplingar } = require('./commands/sokKopplingar');
const { behandRES } = require('./commands/behandlingResultat');
const { oppenSökning } = require('./commands/oppenSökning');
const { loggaUt } = require('./commands/loggaUt');
const { sokOrg } = require('./commands/sokOrg');
const { sokOmbud } = require('./commands/sokOmbud');

test.describe('Dynamiskt genererade användare', () => {
  test('1. ÖPPEN SÖK', async ({ page }) => {
    await testLogin(page);
    await oppenSökning(page);
    await loggaUt(page);
  });

  test('2. SÖK verksamhet', async ({ page }) => {
    await testLogin(page);
    await sokOrg(page);
    await sokKopplingar(page);
    await behandRES(page);
    await sokOmbud(page);
    await loggaUt(page);
  });
});
