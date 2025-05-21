const fs = require('fs');
const csv = require('csv-parser');

async function readOmBudFromCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
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

module.exports = { readOmBudFromCSV };
