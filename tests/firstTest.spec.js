// @ts-check
const { test } = require("@playwright/test");
const { testLogin } = require("../tests/commands/login");
const { sokOrg } = require("../tests/commands/sokOrg");
const { andraSokOrg } = require("../tests/commands/andrsSokOrg");
const { felOrg } = require("../tests/commands/felOrg");
const { sokKopplingar } = require("../tests/commands/sokKopplingar");
const { behandRES } = require("../tests/commands/behandlingResultat");
const { oppenSökning } = require("../tests/commands/oppenSökning");
const { loggaUt } = require("../tests/commands/loggaUt");

test.skip("Loggar in,Söker Org,veriferar Org nummer", async ({ page }) => {
  console.log("✅ Det funkar!");
  await testLogin(page);
  //await sokOrg(page);
  //await andraSokOrg(page); // Här används din uppdelade login-funktion
  //await felOrg(page);
});

test("1.ÖPPEN SÖK,Loggar in,Söker Org,Sök Kopplingar,SÖK behandlingsresultat", async ({
  page,
}) => {
  await testLogin(page);
  await oppenSökning(page);
});

test("2.SÖK VERKSAMHET,Loggar in,Söker Org,Sök Kopplingar,SÖK behandlingsresultat", async ({
  page,
}) => {
  await testLogin(page);
  await sokKopplingar(page);
  await behandRES(page);
});

test("Loggar ut", async ({ page }) => {
  await testLogin(page);
  await loggaUt(page);
});
