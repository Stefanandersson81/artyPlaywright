const fs = require('fs');
const csv = require('csv-parser');

/**
 * Läser in alla användare från CSV-fil (om du vill använda CSV)
 */
async function readAllUsersFromCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

/**
 * Genererar ett användarobjekt dynamiskt utifrån ett index.
 * Exempel: getPerfUser(1) => { username: 'perftest001@art.se', password: 'Password@123456' }
 */
function getPerfUser(index) {
  const num = String(index).padStart(3, '0'); // 001, 002, ...
  return {
    username: `perftest${num}@art.se`,
    password: 'Password@123456'
  };
}

module.exports = { readAllUsersFromCSV, getPerfUser };
