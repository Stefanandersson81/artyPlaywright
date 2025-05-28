const { Inloggning } = require("../commands/loggarIn");
const { oppenSökning } = require("../commands/oppenSökning");
const { loggaUt } = require("../commands/loggaUt");
const { sokVerksamhet } = require("../commands/sökVerksamhet");
const { sokKopplingar } = require("../commands/sokKopplingar");
const { behandRES } = require("../commands/behandlingResultat");

async function testArtillery(page, vuContext, events, test) {
  const scenarioName = vuContext.scenario.name;
  const iterations = 10;

  const scenarioSteps = {
    "Open-search": [
      { name: "testLogin", fn: () => Inloggning(page, vuContext, events, test) },
      { name: "oppenSökning", fn: () => oppenSökning(page, vuContext, events, test) },
      { name: "loggaUt", fn: () => loggaUt(page, vuContext, events) }
    ],
    "Verksamhet_Kopplingar_BehandllingsResultat": [
      { name: "testLogin", fn: () => Inloggning(page, vuContext, events, test) },
      { name: "sokVerksamhet", fn: () => sokVerksamhet(page, vuContext, events) },
      { name: "sokKopplingar", fn: () => sokKopplingar(page, vuContext, events) },
      { name: "behandRES", fn: () => behandRES(page, vuContext, events) },
      { name: "loggaUt", fn: () => loggaUt(page, vuContext, events) }
    ],
  };

  

  const steps = scenarioSteps[scenarioName];
  if (!steps) throw new Error(`❌ Okänt scenario: ${scenarioName}`);

  for (let i = 1; i <= iterations; i++) {
    const iterationStart = Date.now();
    console.log(`🔁 Iteration ${i}/${iterations} för [${scenarioName}]`);

    for (const step of steps) {
      const start = Date.now();
      try {
        console.log(`▶️ Kör steg: ${step.name}`);
        await step.fn();
        events.emit("counter", `step.${step.name}.success`, 1);
      } catch (err) {
        console.error(`❌ ${step.name} failed:`, err);
        events.emit("counter", `step.${step.name}.error`, 1);
        events.emit("error", `step.${step.name}.failed`);
      }
      const duration = Date.now() - start;
      console.log(`⏱ ${step.name} tog ${duration} ms`);
    }

    const iterationDuration = Date.now() - iterationStart;
    events.emit("histogram", `iteration.${scenarioName}`, iterationDuration);
  }

  console.log(`✅ Slutförde ${iterations} iterationer av [${scenarioName}]`);
  events.emit("counter", `scenario.${scenarioName}.completed`, 1);
}

module.exports = { testArtillery };