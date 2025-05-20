const fs = require('fs');
const csv = require('csv-parser');

async function readOrgNumFromCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Normalisera alla fältnamn till lowercase utan mellanslag
        const normalized = {};
        for (const [key, value] of Object.entries(row)) {
          normalized[key.trim().toLowerCase()] = value.trim();
        }
        results.push(normalized);
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

module.exports = { readOrgNumFromCSV };
