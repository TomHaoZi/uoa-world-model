// The sky over the campus: the sun where it really stands at the time shown, and deciduous trees
// by the season. The local edition uses the built-in sky in Now mode too.
import { expect, test, type Page } from "@playwright/test";
import { open, shot } from "./helpers.ts";

const light = (page: Page) => page.evaluate(() => window.__scene!.lightState());

test("the sun stands where it really does at the time shown, and deciduous trees follow the season", async ({ page }) => {
  // Winter noon: the sun due north and low, 90° - 36.85° - 23.44°.
  await open(page, "?time=preview&date=2026-06-22&t=12:20");
  let l = await light(page);
  expect(l.elevation).toBeGreaterThan(28);
  expect(l.elevation).toBeLessThan(31.5);
  expect(Math.min(l.azimuth, 360 - l.azimuth)).toBeLessThan(5);
  expect(l.weather).toBeUndefined();
  expect(l.deciduousTrees).toBeGreaterThan(10);
  const winter = l.deciduous;
  await shot(page, "17-sun-winter-noon");

  // Summer noon: high in the north.
  await open(page, "?time=preview&date=2026-12-21&t=13:20");
  l = await light(page);
  expect(l.elevation).toBeGreaterThan(74);
  expect(l.elevation).toBeLessThan(79);
  expect(l.deciduous).not.toBe(winter);
  await shot(page, "17-sun-summer-noon");

  // A summer morning: low in the east-north-east, held at 10° so shadows stay on the map.
  await open(page, "?time=preview&date=2026-12-21&t=06:40");
  l = await light(page);
  expect(l.azimuth).toBeGreaterThan(95);
  expect(l.azimuth).toBeLessThan(130);
  expect(l.elevation).toBeCloseTo(10, 0);

  // Autumn leaves differ from both.
  await open(page, "?time=preview&date=2026-04-28&t=12:00");
  l = await light(page);
  expect(l.deciduous).not.toBe(winter);
});

test("Now mode draws the built-in sky without requesting live weather", async ({ page }) => {
  const requests: string[] = [];
  await page.route("**/api.open-meteo.com/**", (route) => {
    requests.push(route.request().url());
    return route.abort();
  });
  await open(page, "");
  // The upstream startup request waited 1.5 seconds after the map loaded.
  await page.waitForTimeout(2000);
  expect(requests).toEqual([]);
  expect((await light(page)).weather).toBeUndefined();
  await expect(page.locator(".chip-weather")).toHaveCount(0);
  await expect(page.locator("#rain-layer")).toHaveCount(0);
});
