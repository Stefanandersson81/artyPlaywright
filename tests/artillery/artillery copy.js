const { Inloggning } = require("../commands/loggarIn");
const { oppenSökning } = require("../commands/oppenSökning");
const { loggaUt } = require("../commands/loggaUt");
const { sokVerksamhet } = require("../commands/sökVerksamhet");
const { sokKopplingar } = require("../commands/sokKopplingar");
const { behandRES } = require("../commands/behandlingResultat");

async function testArtillery(page, vuContext, events, test) {
  const scenarioName = vuContext.scenario.name;

  const scenarioSteps = {
    "Open-search": [
      { name: "testLogin", fn: () => Inloggning(page, vuContext, events, test) },
      { name: "oppenSökning", fn: () => oppenSökning(page, vuContext, events, test) },
      { name: "loggaUt", fn: () => loggaUt(page, vuContext, events) }
    ],
    "Verksamhet_Kopplingar_BehandlingsResultat": [
      { name: "testLogin", fn: () => Inloggning(page, vuContext, events, test) },
      { name: "sokVerksamhet", fn: () => sokVerksamhet(page, vuContext, events) },
      { name: "sokKopplingar", fn: () => sokKopplingar(page, vuContext, events) },
      { name: "behandRES", fn: () => behandRES(page, vuContext, events) },
      { name: "loggaUt", fn: () => loggaUt(page, vuContext, events) }
    ],
  };

  const steps = scenarioSteps[scenarioName];
  if (!steps) throw new Error(`❌ Okänt scenario: ${scenarioName}`);

  console.log(`🚀 Kör scenario: [${scenarioName}]`);

  const startTime = Date.now();
  for (const step of steps) {
    const stepStart = Date.now();
    try {
      console.log(`▶️ Kör steg: ${step.name}`);
      await step.fn();
      events.emit("counter", `step.${step.name}.success`, 1);
    } catch (err) {
      console.error(`❌ ${step.name} failed:`, err);
      events.emit("counter", `step.${step.name}.error`, 1);
      events.emit("error", `step.${step.name}.failed`);
    }
    const stepDuration = Date.now() - stepStart;
    console.log(`⏱ ${step.name} tog ${stepDuration} ms`);
  }

  const totalDuration = Date.now() - startTime;
  events.emit("histogram", `scenario.${scenarioName}`, totalDuration);
  events.emit("counter", `scenario.${scenarioName}.completed`, 1);
}

module.exports = { testArtillery };