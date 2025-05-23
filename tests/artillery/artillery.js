// artillery.js
const { testLogin } = require('../commands/login');
const { sokOrg } = require('../commands/sokOrg');
const { sokKopplingar } = require('../commands/sokKopplingar');
const { behandRES } = require('../commands/behandlingResultat');
const { loggaUt } = require('../commands/loggaUt');
const { oppenSökning } = require('../commands/oppenSökning');
const { sokOmbud } = require('../commands/sokOmbud');

async function testArtillery(page, vuContext, events, test) {
  const scenarioName = vuContext.scenario.name;

  console.log(`🚀 [${scenarioName}] startar`);

  const loginOpenSearch = [
    { name: '🔐 testLogin',    fn: () => testLogin(page), metric: 'testLogin.duration' },
    { name: '🔍 oppenSökning', fn: () => oppenSökning(page), metric: 'oppenSokning.duration' },
    { name: '🔐 loggaUt',      fn: () => loggaUt(page), metric: 'loggaUt.duration' }
  ];

  const sokOrgKopflow = [
    { name: '🔐 testLogin',      fn: () => testLogin(page), metric: 'testLogin.duration' },
    { name: '🔍 sokOrg',         fn: () => sokOrg(page), metric: 'sokOrg.duration' },
    { name: '🔍 sokKopplingar',  fn: () => sokKopplingar(page), metric: 'sokKopplingar.duration' },
    { name: '🔍 behandRES',      fn: () => behandRES(page), metric: 'behandRES.duration' },
    { name: '🔍 sokOmbud',       fn: () => sokOmbud(page), metric: 'sokOmbud.duration' },
    { name: '🔐 loggaUt',        fn: () => loggaUt(page), metric: 'loggaUt.duration' }
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
    console.log(`✅ [${scenarioName}] klart`);
  });
  events.emit('counter', `user.${scenarioName}.COMPLETED`, 1);
}

module.exports = { testArtillery };
