const { expect } = require('@playwright/test');

async function sokPagination(page) {
  const MIN_ANTAL = 20000;
  const rows = page.locator("table tbody tr"); // Deklarera EN gång här

  // 1. Kolla om pagination finns
  const pagination = page.locator(".pagination span").first();
  let antalPoster = 0;

  try {
    await expect(pagination).toBeVisible({ timeout: 30000 });
    const paginationText = await pagination.innerText();
    console.log("🔢 Pagination-text:", paginationText);

    // Plocka ut siffrorna efter "av"
    const match = paginationText.match(/av\s*([\d\s]+)/i);
    if (!match) {
      throw new Error(
        `Kunde inte läsa ut totala antalet från pagination-texten: "${paginationText}"`
      );
    }
    antalPoster = parseInt(match[1].replace(/\s/g, ""), 10);
    console.log(`📊 Antal poster: ${antalPoster}`);
  } catch {
    // Ingen pagination, klicka första raden om den finns och returnera
    const rowCount = await rows.count();
    if (rowCount === 0) {
      console.log("⚠️ Ingen data, klickar första raden ändå");
      await rows.first().click();
    } else {
      await expect(rows.first()).toBeVisible();
      await rows.first().click();
    }
    return;
  }

  // 2. Om pagination finns och antal är över MIN_ANTAL, lägg till kommunkod-filter
  if (antalPoster >= MIN_ANTAL) {
    console.log(`🔎 För många poster (${antalPoster}), lägger till kommunkod-filter...`);
    await page.locator("#kommunkod").fill("0100 - Stockholms län", { delay: 300 });
    await page.getByRole("button", { name: /Sök/ }).first().click();

    // Vänta på att tabellen laddas om
    await page.waitForSelector("table tbody tr", { timeout: 120000 }).catch(() => {});
    // Läs om pagination igen
    try {
      await expect(pagination).toBeVisible({ timeout: 30000 });
      const paginationText = await pagination.innerText();
      const match = paginationText.match(/av\s*([\d\s]+)/i);
      if (!match) throw new Error("Kunde inte läsa ut antal efter kommunkod-filter");
      antalPoster = parseInt(match[1].replace(/\s/g, ""), 10);
      console.log(`📊 Antal poster efter kommunkod-filter: ${antalPoster}`);
    } catch {
      // Om pagination försvann, klicka första raden och returnera
      const rowCount = await rows.count();
      if (rowCount === 0) {
        console.log("⚠️ Ingen data, klickar första raden ändå");
        await rows.first().click();
      } else {
        await expect(rows.first()).toBeVisible();
        await rows.first().click();
      }
      return;
    }
  }

  // 3. Om pagination fortfarande finns och antal är över MIN_ANTAL, lägg till anteckningstyp-filter
  if (antalPoster >= MIN_ANTAL) {
    console.log(`🔎 Fortfarande för många poster (${antalPoster}), lägger till anteckningstyp-filter...`);
    await page.locator("#anteckningstyp").selectOption({ label: "Avfallsproducent" });
    await page.getByRole("button", { name: /Sök/ }).first().click();

    // Vänta på att tabellen laddas om
    await page.waitForSelector("table tbody tr", { timeout: 120000 }).catch(() => {});
    // Läs om pagination igen
    try {
      await expect(pagination).toBeVisible({ timeout: 30000 });
      const paginationText = await pagination.innerText();
      const match = paginationText.match(/av\s*([\d\s]+)/i);
      if (!match) throw new Error("Kunde inte läsa ut antal efter anteckningstyp-filter");
      antalPoster = parseInt(match[1].replace(/\s/g, ""), 10);
      console.log(`📊 Antal poster efter anteckningstyp-filter: ${antalPoster}`);
    } catch {
      // Om pagination försvann, klicka första raden och returnera
      const rowCount = await rows.count();
      if (rowCount === 0) {
        console.log("⚠️ Ingen data, klickar första raden ändå");
        await rows.first().click();
      } else {
        await expect(rows.first()).toBeVisible();
        await rows.first().click();
      }
      return;
    }
  }

  // 4. Nu ska antalet vara under MIN_ANTAL, klicka första raden
  const rowCount = await rows.count();
  if (rowCount === 0) {
    console.log("⚠️ Ingen data, klickar första raden ändå");
    await rows.first().click();
  } else {
    await expect(rows.first()).toBeVisible();
    await rows.first().click();
  }
}

module.exports = {
  sokPagination,
};
