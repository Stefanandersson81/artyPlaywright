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

  console.log(`🚀 Startar scenario-loop: [${scenarioName}]`);

  const maxDurationMs = 30 * 60 * 1000; // Max 30 min per VU – justera om du vill matcha testets längd
  const startTime = Date.now();
  let iteration = 0;

  while (Date.now() - startTime < maxDurationMs) {
    iteration++;
    console.log(`🔁 Iteration ${iteration} för scenario [${scenarioName}]`);

    const scenarioStart = Date.now();
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

    const scenarioDuration = Date.now() - scenarioStart;
    events.emit("histogram", `scenario.${scenarioName}`, scenarioDuration);
    events.emit("counter", `scenario.${scenarioName}.completed`, 1);
  }

  console.log(`🏁 Avslutar scenario-loop: [${scenarioName}] efter ${Date.now() - startTime} ms`);
}

module.exports = { testArtillery };
