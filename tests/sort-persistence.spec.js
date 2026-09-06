// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('table sort persistence', () => {
  test('defaults to sorting by last push, oldest first', async ({ page }) => {
    await page.goto('/index.html');
    const initial = await page.evaluate(() => ({ sortBy: S.sortBy, sortDir: S.sortDir }));
    expect(initial).toEqual({ sortBy: 'commit', sortDir: 'asc' });
  });

  test('remembers sort column and direction across a reload', async ({ page }) => {
    await page.goto('/index.html');

    // First click sorts by "issues" descending (its default direction);
    // second click flips to ascending — exercises both the column-change
    // and direction-toggle branches of setSort() before persisting.
    await page.click('#th-issues');
    await page.click('#th-issues');

    const stored = await page.evaluate(() => ({
      rw_sort_by: localStorage.getItem('rw_sort_by'),
      rw_sort_dir: localStorage.getItem('rw_sort_dir'),
    }));
    expect(stored).toEqual({ rw_sort_by: 'issues', rw_sort_dir: 'asc' });

    await page.reload();

    const restored = await page.evaluate(() => ({ sortBy: S.sortBy, sortDir: S.sortDir }));
    expect(restored).toEqual({ sortBy: 'issues', sortDir: 'asc' });
    await expect(page.locator('#th-issues')).toHaveClass(/active/);
    await expect(page.locator('#arr-issues')).toHaveText('↑');
  });

  test('ignores a corrupted stored sort column and falls back to the default', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('rw_sort_by', 'not-a-real-column');
      localStorage.setItem('rw_sort_dir', 'sideways');
    });
    await page.goto('/index.html');

    const state = await page.evaluate(() => ({ sortBy: S.sortBy, sortDir: S.sortDir }));
    expect(state).toEqual({ sortBy: 'commit', sortDir: 'asc' });
  });
});
