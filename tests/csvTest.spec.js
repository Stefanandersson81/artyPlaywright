const path = require('path');
const { test, expect } = require('@playwright/test');
const { readAllUsersFromCSV } = require('./utils/csvReader'); // korrekt lokal sökväg

test('Läs användare från CSV', async () => {
  const csvPath = path.join(__dirname, 'fixtures', 'data.csv'); // korrekt absolut sökväg
  const users = await readAllUsersFromCSV(csvPath);

  expect(users.length).toBeGreaterThan(0);
  console.log(users);
});
