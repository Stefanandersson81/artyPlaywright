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
          await testLogin(page, { metrics: events });
        },
        metric: "loginTime",
      },
      {
        name: "🔍 oppenSökning",
        fn: async () => {
          await oppenSökning(page, { metrics: events });
        },
        metric: null,
      },
      {
        name: "🔐 loggaUt",
        fn: async () => {
          await loggaUt(page, { metrics: events });
        },
        metric: "08_LoggaUt",
      },
    ],
    "sok-Org-Kop-flow": [
      {
        name: "🔐 testLogin",
        fn: async () => {
          await testLogin(page, { metrics: events });
        },
        metric: "loginTime",
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
        fn: async () => {
          await loggaUt(page, { metrics: events });
        },
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