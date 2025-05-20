// artillery.js
const { testLogin }       = require('../commands/login');
const { sokOrg }          = require('../commands/sokOrg');
const { sokKopplingar }   = require('../commands/sokKopplingar');
const { behandRES }       = require('../commands/behandlingResultat');
const { loggaUt }         = require('../commands/loggaUt');
const { oppenSökning }    = require('../commands/oppenSökning');
const fs                  = require('fs');
const path                = require('path');
const csv                 = require('csv-parser');

let users = [];
let globalVuIndex = 0;

async function loadUsers() {
  if (users.length) return users;
  const csvPath = path.join(__dirname, '../fixtures/data.csv');
  return new Promise((resolve, reject) => {
    const result = [];
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', row => {
        const headers  = Object.keys(row);
        const username = row.username || row['användarnamn'] || row.user || row.email || row[headers[0]];
        const password = row.password || row['lösenord']   || row[headers[1]];
        result.push({ username, password });
      })
      .on('end', () => { users = result; resolve(result); })
      .on('error', reject);
  });
}

async function testArtillery(page, vuContext, events, test) {
  const scenarioName = vuContext.scenario.name;
  const userIndex    = globalVuIndex++;
  const allUsers     = await loadUsers();
  const user         = allUsers[userIndex];
  if (!user) throw new Error(`❌ Ingen användare för index=${userIndex}`);

  console.log(`🚀 [${scenarioName}] startar för ${user.username}`);
  events.emit("counter", `user.${scenarioName}.STARTED`, 1);

  // --- Definiera dina två scenarion ---
  const stepsLoginSearch = [
    { name: "🔐 testLogin",      fn: () => testLogin(page, user.username, user.password), metric: "testLogin.duration" },
    { name: "🔍 oppenSökning",   fn: () => oppenSökning(page),                         metric: "oppenSökning.duration" },
    { name: "🔐 loggaUt",        fn: () => loggaUt(page, user.username),              metric: "loggaUt.duration" }
  ];

  const stepsFullFlow = [
    { name: "🔐 testLogin",      fn: () => testLogin(page, user.username, user.password), metric: "testLogin.duration" },
    { name: "🔍 sokOrg",         fn: () => sokOrg(page),                                metric: "sokOrg.duration" },
    { name: "🔍 sokKopplingar",  fn: () => sokKopplingar(page),                         metric: "sokKopplingar.duration" },
    { name: "🔍 behandRES",      fn: () => behandRES(page),                             metric: "behandRES.duration" },
    { name: "🔐 loggaUt",        fn: () => loggaUt(page, user.username),              metric: "loggaUt.duration" }
  ];

  // --- Välj steps baserat på scenario-name ---
  const steps = scenarioName === "login-search"
    ? stepsLoginSearch
    : stepsFullFlow;

  // --- Kör stegen och spela in metrics ---
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
      events.emit("histogram", step.metric, duration);
    });
  }

  await test.step("🏁 Slut på testArtillery", async () => {
    console.log(`✅ [${scenarioName}] klart för ${user.username}`);
  });
  events.emit("counter", `user.${scenarioName}.COMPLETED`, 1);
}

module.exports = { testArtillery };
