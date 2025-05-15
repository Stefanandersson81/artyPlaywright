// @ts-check
const { test,expect } = require("@playwright/test");
const { testLogin } = require("../tests/commands/login");
const { sokKopplingar } = require("../tests/commands/sokKopplingar");
const { behandRES } = require("../tests/commands/behandlingResultat");
const { oppenSökning } = require("../tests/commands/oppenSökning");
const { loggaUt } = require("../tests/commands/loggaUt");

test.beforeEach(async ({ context }) => {
  const page = await context.newPage();
  await context.clearCookies();
  await context.clearPermissions();
});


test("1.ÖPPEN SÖK,Loggar in,Söker Org,Sök Kopplingar,SÖK behandlingsresultat", async ({
  page,
}) => {
  await testLogin(page);
  await oppenSökning(page);
  await loggaUt(page);
});

test("2.SÖK VERKSAMHET,Loggar in,Söker Org,Sök Kopplingar,SÖK behandlingsresultat", async ({
  page,
}) => {
  await testLogin(page);
  await sokKopplingar(page);
  await behandRES(page);
  await loggaUt(page);
});

