// @ts-check
const { test } = require('@playwright/test');
const { loginAnd2FA } = require('./commands/login');
const { sokKopplingar } = require('./commands/sokKopplingar');
const { behandRES } = require('./commands/behandlingResultat');
const { oppenSökning } = require('./commands/oppenSökning');
const { loggaUt } = require('./commands/loggaUt');
const { sokVerksamhet } = require('./commands/sökVerksamhet');
const { Inloggning } = require('./commands/loggarIn');

// Dummy context to satisfy functions expecting context.metrics
const noopContext = {};

test.describe('Dynamiskt genererade användare', () => {
  test('1. ÖPPEN SÖK', async ({ page }) => {
    await loginAnd2FA(page, noopContext);
    //await oppenSökning(page);
    await loggaUt(page, noopContext);
  });

  test('2. SÖK verksamhet', async ({ page }) => {
    await Inloggning();
    await sokVerksamhet(page, noopContext);
    await sokKopplingar(page);
    await behandRES(page, noopContext);
    await loggaUt(page, noopContext);
  });

  test.only('3. SÖK verksamhet', async ({ page }, testInfo) => {
  const dummyEvents = {
    emit: (type, name, value) => {
      console.log(`[EVENT] ${type} | ${name} | ${value}`);
    }
  };

  const vuContext = {
    scenario: { name: 'Open-search' },
    vars: {}
  };

  await Inloggning(page, vuContext, dummyEvents, testInfo);
  await loggaUt(page, {});
});

});
