// @ts-check
const { test } = require('@playwright/test');
const { testLogin } = require('../tests/commands/login');
const { sokOrg } = require('../tests/commands/sokOrg');
const { andraSokOrg } = require('../tests/commands/andrsSokOrg');
const { felOrg } = require('../tests/commands/felOrg');

test('Loggar in,Söker Org,veriferar Org nummer', async ({page}) => {
  console.log("✅ Det funkar!");
await testLogin(page);
await sokOrg(page);
await andraSokOrg(page); // Här används din uppdelade login-funktion
await felOrg(page);
})