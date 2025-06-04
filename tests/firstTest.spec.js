// @ts-check
const { test } = require('@playwright/test');
const { sokKopplingar } = require('./commands/sokKopplingar');
const { behandRES } = require('./commands/behandlingResultat');
const { oppenSökning } = require('./commands/oppenSökning');
const { loggaUt } = require('./commands/loggaUt');
const { sokVerksamhet } = require('./commands/sökVerksamhet');
const { Inloggning } = require('./commands/loggarIn');

// Dummy context to satisfy functions expecting context.metrics
const noopContext = {};

test.describe('Dynamiskt genererade användare för öppen Sök funktion', () => {
  test('1. ÖPPEN SÖK', async ({ page }) => {
    test.setTimeout(240000);
    await Inloggning(page, noopContext);
    await oppenSökning(page);
    await loggaUt(page, noopContext);
  });

  test('2. SÖK verksamhet', async ({ page }) => {
    test.setTimeout(240000);
    await Inloggning(page, noopContext);          
    await sokVerksamhet(page, noopContext);
    await sokKopplingar(page, noopContext);        
    await behandRES(page, noopContext);
    await loggaUt(page, noopContext);
  });
});
