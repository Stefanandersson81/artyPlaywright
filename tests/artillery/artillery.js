// tests/artillery/artillery.js
const { testLogin } = require("../commands/login");
const { sokVerksamhet } = require("../commands/sökVerksamhet");
const { sokKopplingar } = require("../commands/sokKopplingar");
const { behandRES } = require("../commands/behandlingResultat");
const { loggaUt } = require("../commands/loggaUt");
const { oppenSökning } = require("../commands/oppenSökning");
const { sokOmbud } = require("../commands/sokOmbud");

async function testArtillery(page, vuContext, events, test) {
  const scenarioName = vuContext.scenario.name;
  console.log(`🚀 [${scenarioName}] startar`);

  const scenarioSteps = {
    "Open-search": [
      {
        name: "🔐 testLogin",
        fn: async () => {
          // Kör login (testLogin internt emitterar både loginTime och verifyTime)
          await testLogin(page, { metrics: events });
        },
        metric: null,
      },
      {
        name: "🔍 oppenSökning",
        fn: () => oppenSökning(page),
        metric: "oppenSökning.duration",
      },
      {
        name: "🔐 loggaUt",
        fn: async () => {
          // skicka med Artillerys events-objekt som context.metrics
          await loggaUt(page, { metrics: events });
        },
        metric: null, // ingen extra wrapper-metrik
      },
    ],
    "sok-Org-Kop-flow": [
      {
        name: "🔐 testLogin",
        fn: async () => {
          await testLogin(page, { metrics: events });
        },
        metric: null,
      },
      {
        name: "🔍 sokOrg",
        fn: async () => {
          await sokVerksamhet(page, { metrics: events });
        },
        metric: "sokOrg.duration",
      },
      {
        name: "🔍 sokKopplingar",
        fn: async () => {
          await sokKopplingar(page, { metrics: events });
        },
        metric: "sokKopplingar.duration",
      },
      {
        name: "🔍 behandRES",
        fn: async () => {
          await behandRES(page, { metrics: events });
        },
        metric: "behandRES.duration",
      },
      {
        name: "🔐 loggaUt",
        fn: () => loggaUt(page),
        metric: "loggaUt.duration",
      },
    ],
  };

  const steps = scenarioSteps[scenarioName];
  if (!steps) throw new Error(`❌ Okänt scenario: ${scenarioName}`);

  for (const step of steps) {
    await test.step(step.name, async () => {
      const start = Date.now();
      try {
        await step.fn();
        events.emit("counter", `${step.name}.success`, 1);
      } catch (err) {
        console.error(`❌ ${step.name} failed:`, err);
        events.emit("counter", `${step.name}.error`, 1);
        events.emit("error", `${step.name}.failed`);
      }
      const duration = Date.now() - start;
      console.log(`⏱ ${step.name} tog ${duration} ms`);
      if (step.metric) {
        events.emit("histogram", step.metric, duration);
      }
    });
  }

  await test.step("🏁 Slut på testArtillery", async () => {
    console.log(`✅ [${scenarioName}] klart`);
  });
  events.emit("counter", `user.${scenarioName}.COMPLETED`, 1);
}

module.exports = { testArtillery };
