const { testLogin } = require('../commands/login');
const { sokOrg } = require('../commands/sokOrg');
const { andraSokOrg } = require('../commands/andrsSokOrg');
const { felOrg } = require('../commands/felOrg');

async function testArtillery(page, vuContext, events, test) {
  const scenarioName = vuContext.scenario.name;
  const userId = vuContext.vu;

  console.log(`🚀 Startar testArtillery för användare ${userId} (${scenarioName})`);
  events.emit("counter", `user.${scenarioName}.STARTED`, 1);

  // === Steg 1: Logga in
  await test.step("🔐 testLogin", async () => {
    const start = Date.now();
    await testLogin(page);
    const duration = Date.now() - start;
    console.log(`⏱ testLogin tog ${duration} ms`);
    events.emit("histogram", "testLogin.duration", duration);
  });

  // === Steg 2: Första sökning
  await test.step("🔍 sokOrg", async () => {
    const start = Date.now();
    await sokOrg(page);
    const duration = Date.now() - start;
    console.log(`⏱ sokOrg tog ${duration} ms`);
    events.emit("histogram", "sokOrg.duration", duration);
  });

  // === Steg 3: Andra sökning
  await test.step("🔁 andraSokOrg", async () => {
    const start = Date.now();
    await andraSokOrg(page);
    const duration = Date.now() - start;
    console.log(`⏱ andraSokOrg tog ${duration} ms`);
    events.emit("histogram", "andraSokOrg.duration", duration);
  });

  // === Steg 4: Felaktig sökning
  await test.step("❌ felOrg", async () => {
    const start = Date.now();
    await felOrg(page);
    const duration = Date.now() - start;
    console.log(`⏱ felOrg tog ${duration} ms`);
    events.emit("histogram", "felOrg.duration", duration);
  });

  // === Avslut
  await test.step("🏁 Slut på testArtillery", async () => {
    console.log(`✅ testArtillery slutfört för ${scenarioName} (${userId})`);
  });

  events.emit("counter", `user.${scenarioName}.COMPLETED`, 1);
}

module.exports = {
  testArtillery
};
