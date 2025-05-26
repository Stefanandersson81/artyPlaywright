// @ts-check
const { test, expect } = require('@playwright/test');
const { testLogin } = require('./commands/login');
const { sokKopplingar } = require('./commands/sokKopplingar');
const { behandRES } = require('./commands/behandlingResultat');
const { oppenSökning } = require('./commands/oppenSökning');
const { loggaUt } = require('./commands/loggaUt');
const { sokVerksamhet } = require('./commands/sökVerksamhet');
const { sokOmbud } = require('./commands/sokOmbud');

// Dummy context to satisfy functions expecting context.metrics
const noopContext = {};

test.describe('Dynamiskt genererade användare', () => {
  test('1. ÖPPEN SÖK', async ({ page }) => {
    await testLogin(page, noopContext);
    await oppenSökning(page);
    await loggaUt(page, noopContext);
  });

  test('2. SÖK verksamhet', async ({ page }) => {
    await testLogin(page, noopContext);
    await sokVerksamhet(page, noopContext);
    await sokKopplingar(page);
    await behandRES(page, noopContext);
    //await sokOmbud(page);
    await loggaUt(page, noopContext);
  });
});
