// @ts-check
const { test, expect } = require('@playwright/test');

// Covers 8109dc0 "shift traffic window to day 1-14 (exclude today's empty
// bucket)" — GitHub's traffic API is day-aggregated UTC with no real-time
// endpoint, so "today" is always an empty/partial bucket and must be
// dropped. No test existed for this at the time.

function dayKey(offset) {
  return new Date(Date.now() - offset * 86400000).toISOString().split('T')[0];
}

test.describe('aggregateTraffic 14-day window', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
  });

  test('produces exactly 14 buckets covering days 1 through 14', async ({ page }) => {
    const result = await page.evaluate(() => aggregateTraffic([]));
    expect(result).toHaveLength(14);
    const expectedDates = await page.evaluate(
      () => Array.from({ length: 14 }, (_, k) => 14 - k)
        .map(i => new Date(Date.now() - i * 86400000).toISOString().split('T')[0])
    );
    expect(result.map(d => d.date)).toEqual(expectedDates);
  });

  test('excludes today (day 0) even when the API returns data for it', async ({ page }) => {
    const today = dayKey(0);
    const result = await page.evaluate((today) => aggregateTraffic([
      { views: [{ timestamp: `${today}T00:00:00Z`, count: 999, uniques: 999 }] },
    ]), today);

    expect(result.find(d => d.date === today)).toBeUndefined();
    expect(result.reduce((s, d) => s + d.views, 0)).toBe(0);
  });

  test('excludes data older than 14 days', async ({ page }) => {
    const tooOld = dayKey(15);
    const result = await page.evaluate((tooOld) => aggregateTraffic([
      { views: [{ timestamp: `${tooOld}T00:00:00Z`, count: 42, uniques: 10 }] },
    ]), tooOld);

    expect(result.find(d => d.date === tooOld)).toBeUndefined();
    expect(result.reduce((s, d) => s + d.views, 0)).toBe(0);
  });

  test('sums views/uniques for in-window dates across repos', async ({ page }) => {
    const day3 = dayKey(3);
    const result = await page.evaluate((day3) => aggregateTraffic([
      { views: [{ timestamp: `${day3}T00:00:00Z`, count: 10, uniques: 4 }] },
      { views: [{ timestamp: `${day3}T00:00:00Z`, count: 5, uniques: 2 }] },
    ]), day3);

    const bucket = result.find(d => d.date === day3);
    expect(bucket).toEqual({ date: day3, views: 15, uniques: 6 });
  });

  test('the chart shows the "yest" and "14d" axis labels once data is present', async ({ page }) => {
    await page.evaluate(() => {
      const data = Array.from({ length: 14 }, (_, i) => ({ date: `d${i}`, views: i + 1, uniques: 1 }));
      renderChart(data);
    });
    const labels = page.locator('#chartLabels');
    await expect(labels).toBeVisible();
    await expect(labels).toContainText('yest');
    await expect(labels).toContainText('14d');
  });

  test('the chart shows the no-PAT message when there is no data', async ({ page }) => {
    await page.evaluate(() => renderChart([]));
    await expect(page.locator('#chartNoPat')).toBeVisible();
    await expect(page.locator('#chartSvg')).toBeHidden();
  });
});
