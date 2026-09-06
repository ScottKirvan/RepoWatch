// @ts-check
const { test, expect } = require('@playwright/test');

// Regression tests for #9 ("Save & Refresh doesn't close the Settings panel
// or refresh the dashboard") and #10 ("Activity feed doesn't show on
// desktop even when enabled"). Root cause for both: stopFeedPoll() called
// `_feedRenderedIds.clear()`, a variable that was never defined anywhere in
// the file. saveConfig() calls stopFeedPoll() before it applies the new
// settings to S, closes the panel, or reloads data — so that uncaught
// ReferenceError silently aborted the rest of saveConfig(). The settings
// still landed in localStorage (that happens earlier in the function), so
// a manual full page reload "fixed" it, which is what made this look like
// a feed-specific bug rather than a save-flow bug.

test.describe('stopFeedPoll', () => {
  test('does not throw', async ({ page }) => {
    await page.goto('/index.html');
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.evaluate(() => stopFeedPoll());

    expect(pageErrors).toEqual([]);
  });
});

test.describe('saveConfig', () => {
  test('closes the Settings panel and applies the new settings in memory', async ({ page }) => {
    await page.goto('/index.html');
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.evaluate(() => openConfig());
    await expect(page.locator('#configOverlay')).toHaveClass(/open/);

    await page.check('#showFeedToggle');
    await page.fill('#patInput', 'ghp_faketoken1234567890');
    await page.click('button.save-btn');

    expect(pageErrors, 'saveConfig() must not throw').toEqual([]);
    await expect(page.locator('#configOverlay')).not.toHaveClass(/open/);

    const state = await page.evaluate(() => ({ pat: S.pat, showFeed: S.showFeed }));
    expect(state).toEqual({ pat: 'ghp_faketoken1234567890', showFeed: true });
  });

  test('persists to localStorage and in-memory state together, not just one', async ({ page }) => {
    await page.goto('/index.html');
    await page.evaluate(() => openConfig());
    await page.check('#showFeedToggle');
    await page.click('button.save-btn');

    const stored = await page.evaluate(() => localStorage.getItem('rw_feed'));
    const inMemory = await page.evaluate(() => S.showFeed);
    expect(stored).toBe('1');
    expect(inMemory).toBe(true);
  });
});
