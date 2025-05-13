const { testLogin } = require('../commands/login');

async function testArtillery(page) {
  console.log("✅ Artillery kör testArtillery!");
  await testLogin(page);
}

module.exports = {
  testArtillery
};
