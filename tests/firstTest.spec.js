// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');

const { testLogin } = require('../tests/commands/login');
const { sokKopplingar } = require('../tests/commands/sokKopplingar');
const { behandRES } = require('../tests/commands/behandlingResultat');
const { oppenSökning } = require('../tests/commands/oppenSökning');
const { loggaUt } = require('../tests/commands/loggaUt');
const { sokOrg } = require('../tests/commands/sokOrg');

function readCSVUsersSync(filePath) {
  const data = fs.readFileSync(filePath, 'utf-8');
  const lines = data.trim().split('\n');
  const headers = lines[0].split(',');
  const users = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const user = {};
    headers.forEach((header, index) => {
      user[header.trim()] = values[index].trim();
    });
    users.push(user);
  }

  return users;
}

const csvPath = path.join(__dirname, 'fixtures', 'data.csv');
const users = readCSVUsersSync(csvPath);

for (const user of users) {
  test.describe(`Tester för ${user.username}`, () => {
    test(`1.ÖPPEN SÖK – ${user.username}`, async ({ page }) => {
      await testLogin(page, user.username, user.password);
      await oppenSökning(page);
      await loggaUt(page, user.username);

    });

    test(`2.SÖK verksamhet – ${user.username}`, async ({ page }) => {
      await testLogin(page, user.username, user.password);
      await sokOrg(page);
      await sokKopplingar(page);
      await behandRES(page);
      await loggaUt(page, user.username);

    }
    );

    test.skip(`3.loggar In och Loggar Ut – ${user.username}`, async ({ page }) => {
      await testLogin(page, user.username, user.password);
      await page.waitForTimeout(8000)
      await loggaUt(page, user.username);

    });
  });
}
