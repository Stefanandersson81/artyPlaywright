// artillery.js
const { testLogin } = require('../commands/login');
const { sokOrg }          = require('../commands/sokOrg');
const { sokKopplingar }   = require('../commands/sokKopplingar');
const { behandRES }       = require('../commands/behandlingResultat');
const { loggaUt }         = require('../commands/loggaUt');
const { oppenSökning }    = require('../commands/oppenSökning');
const fs                  = require('fs');
const path                = require('path');
const csv                 = require('csv-parser');
const { sokOmbud } = require('../commands/sokOmbud');

/*En warmup-fas (1 användare, 30 sekunder, Open-search)
10 användare på Open-search-fasen (60 sek)
5 användare på sok-Org-Kop-flow-fasen (60 sek)
Allt körs enligt Artillerys rekommenderade struktur!
*/

async function testArtillerySingle(page, vuContext, events, test) {
  const scenarioName = vuContext.scenario.name;
  const user = getSingleUser();
  if (!user) throw new Error(`❌ Ingen användare tillgänglig från getSingleUser()`);

  console.log(`🚀 [${scenarioName}] startar för ${user.username}`);
  events.emit('counter', `user.${scenarioName}.STARTED`, 1);

  // Definiera steg för varje scenario, med statKey för statistik
  const loginOpenSearch = [
    { name: '🔐 testLogin',    statKey: 'testLogin',    fn: () => testLogin(page, user.username, user.password), metric: 'testLogin.duration' },
    { name: '🔍 oppenSökning', statKey: 'oppenSokning', fn: () => oppenSökning(page),                  metric: 'oppenSokning.duration' },
    { name: '🔐 loggaUt',      statKey: 'loggaUt',      fn: () => loggaUt(page, user.username),         metric: 'loggaUt.duration' }
  ];

  const sokOrgKopflow = [
    { name: '🔐 testLogin',      statKey: 'testLogin',      fn: () => testLogin(page, user.username, user.password), metric: 'testLogin.duration' },
    { name: '🔍 sokOrg',         statKey: 'sokOrg',         fn: () => sokOrg(page),                                metric: 'sokOrg.duration' },
    { name: '🔍 sokKopplingar',  statKey: 'sokKopplingar',  fn: () => sokKopplingar(page),                         metric: 'sokKopplingar.duration' },
    { name: '🔍 behandRES',      statKey: 'behandRES',      fn: () => behandRES(page),                             metric: 'behandRES.duration' },
    { name: '🔍 sokOmbud',       statKey: 'sokOmbud',       fn: () => sokOmbud(page),                              metric: 'sokOmbud.duration' },
    { name: '🔐 loggaUt',        statKey: 'loggaUt',        fn: () => loggaUt(page, user.username),               metric: 'loggaUt.duration' }
  ];

  const scenarioSteps = {
    'Open-search': loginOpenSearch,
    'sok-Org-Kop-flow': sokOrgKopflow
  };

  const steps = scenarioSteps[scenarioName];
  if (!steps) throw new Error(`❌ Okänt scenario: ${scenarioName}`);

  for (const step of steps) {
    await test.step(step.name, async () => {
      const start = Date.now();
      try {
        await step.fn();
        events.emit('counter', `${step.statKey}.success`, 1); // Korrekt nyckel
      } catch (err) {
        console.error(`❌ ${step.name} failed:`, err);
        events.emit('counter', `${step.statKey}.error`, 1);   // Korrekt nyckel
        events.emit('error', `${step.statKey}.failed`);
      }
      const duration = Date.now() - start;
      console.log(`⏱ ${step.name} tog ${duration} ms`);
      events.emit('histogram', step.metric, duration);
    });
  }

  await test.step('🏁 Slut på testArtillerySingle', async () => {
    console.log(`✅ [${scenarioName}] klart för ${user.username}`);
  });
  events.emit('counter', `user.${scenarioName}.COMPLETED`, 1);
}

module.exports = { testArtillerySingle };
