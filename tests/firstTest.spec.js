// @ts-check
const { test } = require('@playwright/test');
import { testLogin } from './commands/login.js';

test('Login Test', async ({page}) => {
  console.log("✅ Det funkar!");
await testLogin(page);
})