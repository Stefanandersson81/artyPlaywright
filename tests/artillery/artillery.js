const { testLogin } = require('../commands/login');
const { sokOrg } = require('../commands/sokOrg');
const { andraSokOrg } = require('../commands/andrsSokOrg');
const { behandRES } = require('../commands/behandlingResultat');
const { loggaUt } = require('../commands/loggaUt');
const { oppenSökning } = require('../commands/oppenSökning');

async function testArtillery(page, vuContext, events, test) {
  const scenarioName = vuContext.scenario.name;
  const userId = vuContext.vu;

  console.log(`🚀 Startar testArtillery för användare ${userId} (${scenarioName})`);
  events.emit("counter", `user.${scenarioName}.STARTED`, 1);

  const steps = [
    { name: "🔐 testLogin", fn: testLogin, metric: "testLogin.duration" },
    { name: "🔍 sokOrg", fn: sokOrg, metric: "sokOrg.duration" },
    { name: "🔍 andraSokOrg", fn: andraSokOrg, metric: "andraSokOrg.duration" },
    { name: "🔍 behandRES", fn: behandRES, metric: "behandRES.duration" },
    { name: "❌ loggaUt", fn: loggaUt, metric: "loggaUt.duration" },
    { name: "🔐 testLogin två", fn: testLogin, metric: "testLogin.duration" },
    { name: "🔍 oppenSökning", fn: oppenSökning, metric: "oppenSökning.duration" },
    { name: "❌ loggaUtTvå", fn: loggaUt, metric: "loggaUtTvå.duration" }
  ];

  for (const step of steps) {
    await test.step(step.name, async () => {
      const start = Date.now();
      try {
        console.log(`▶️ Kör ${step.name}...`);
        await step.fn(page);
      } catch (error) {
        console.error(`❌ Fel i ${step.name}:`, error);
        events.emit("error", `${step.name}.failed`);
      }
      const duration = Date.now() - start;
      console.log(`⏱ ${step.name} tog ${duration} ms`);
      events.emit("histogram", step.metric, duration);
    });
  }

  await test.step("🏁 Slut på testArtillery", async () => {
    console.log(`✅ testArtillery slutfört för ${scenarioName} (${userId})`);
  });

  events.emit("counter", `user.${scenarioName}.COMPLETED`, 1);
}

module.exports = {
  testArtillery
};
