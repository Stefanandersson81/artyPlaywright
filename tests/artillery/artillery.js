// artillery.js
const { testLogin, getNextUser } = require('../commands/login'); // Lägg till denna rad
const { sokOrg }          = require('../commands/sokOrg');
const { sokKopplingar }   = require('../commands/sokKopplingar');
const { behandRES }       = require('../commands/behandlingResultat');
const { loggaUt }         = require('../commands/loggaUt');
const { oppenSökning }    = require('../commands/oppenSökning');
const fs                  = require('fs');
const path                = require('path');
const csv                 = require('csv-parser');
const { sokOmbud } = require('../commands/sokOmbud');

// Ta bort users/globalVuIndex/loadUsers – vi använder getNextUser istället

async function testArtillery(page, vuContext, events, test) {
  const scenarioName = vuContext.scenario.name; // "Open-search" eller "sok-Org-Kop-flow"
  const user = getNextUser(); // Hämta användare från login.js
  if (!user) throw new Error(`❌ Ingen användare tillgänglig från getNextUser()`);

  console.log(`🚀 [${scenarioName}] startar för ${user.username}`);
  events.emit('counter', `user.${scenarioName}.STARTED`, 1);

  // Definiera steg för varje scenario
  const loginOpenSearch = [
    { name: '🔐 testLogin',    fn: () => testLogin(page, user.username, user.password), metric: 'testLogin.duration' },
    { name: '🔍 oppenSökning', fn: () => oppenSökning(page),                  metric: 'oppenSökning.duration' },
    { name: '🔐 loggaUt',      fn: () => loggaUt(page, user.username),         metric: 'loggaUt.duration' }
  ];

  const sokOrgKopflow = [
    { name: '🔐 testLogin',      fn: () => testLogin(page, user.username, user.password), metric: 'testLogin.duration' },
    { name: '🔍 sokOrg',         fn: () => sokOrg(page),                                metric: 'sokOrg.duration' },
    { name: '🔍 sokKopplingar',  fn: () => sokKopplingar(page),                         metric: 'sokKopplingar.duration' },
    { name: '🔍 behandRES',      fn: () => behandRES(page),                             metric: 'behandRES.duration' },
    { name: '🔍 sokOmbud',      fn: () => sokOmbud(page),                             metric: 'sokOmbud.duration' },
    { name: '🔐 loggaUt',        fn: () => loggaUt(page, user.username),              metric: 'loggaUt.duration' }
  ];

  // Mappa scenario till steg
  const scenarioSteps = {
    'Open-search': loginOpenSearch,
    'sok-Org-Kop-flow': sokOrgKopflow
  };

  const steps = scenarioSteps[scenarioName];
  if (!steps) throw new Error(`❌ Okänt scenario: ${scenarioName}`);

  // Kör alla steg
  for (const step of steps) {
    await test.step(step.name, async () => {
      const start = Date.now();
      try {
        await step.fn();
        events.emit('counter', `${step.name}.success`, 1);
      } catch (err) {
        console.error(`❌ ${step.name} failed:`, err);
        events.emit('counter', `${step.name}.error`, 1);
        events.emit('error', `${step.name}.failed`);
      }
      const duration = Date.now() - start;
      console.log(`⏱ ${step.name} tog ${duration} ms`);
      events.emit('histogram', step.metric, duration);
    });
  }

  await test.step('🏁 Slut på testArtillery', async () => {
    console.log(`✅ [${scenarioName}] klart för ${user.username}`);
  });
  events.emit('counter', `user.${scenarioName}.COMPLETED`, 1);
}

module.exports = { testArtillery };
