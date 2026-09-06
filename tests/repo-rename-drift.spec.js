// @ts-check
const { test, expect } = require('@playwright/test');

// A repo the user is monitoring can get renamed on GitHub after it was
// added to Settings. GitHub's REST API transparently redirects the old
// name for regular repo endpoints, so the table kept working — but two
// things didn't, and both trace back to the same root cause: fetchRepo()
// discarded the canonical `full_name` GitHub's API actually returned and
// echoed back whatever string the user had typed instead.
//
// 1. pollEvents() filtered the user's events against that stale typed
//    string, but GitHub's Events API reports each event's *current*
//    canonical repo name and never redirects old ones — so events for a
//    renamed repo silently never matched, and the whole feed could look
//    empty with no visible error anywhere.
// 2. The table displayed the stale name forever instead of picking up
//    the rename, even though every other piece of data for that repo
//    (pushes, PRs, issues) was fetched and displayed correctly.

test.describe('fetchRepo canonical full_name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
  });

  test('uses the name GitHub\'s API actually returns, not the name it was called with', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const realFetch = window.fetch;
      window.fetch = async (url) => {
        if (String(url).endsWith('/repos/owner/old-name')) {
          return { ok: true, json: async () => ({ full_name: 'owner/new-name', pushed_at: '2026-01-01T00:00:00Z' }) };
        }
        if (String(url).includes('/releases/latest')) return { ok: false, status: 404 };
        if (String(url).includes('/pulls'))           return { ok: true, json: async () => [] };
        if (String(url).includes('/issues'))          return { ok: true, json: async () => [] };
        return { ok: false, status: 404 };
      };
      try {
        return await fetchRepo('owner/old-name', {});
      } finally {
        window.fetch = realFetch;
      }
    });

    expect(result.full_name).toBe('owner/new-name');
  });
});

test.describe('pollEvents matches against the current canonical repo name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
  });

  test('still surfaces events for a repo whose Settings entry is a stale (renamed) name', async ({ page }) => {
    const feedItems = await page.evaluate(async () => {
      S.pat = 'fake-pat';
      S.currentUser = 'owner';
      S.repos = ['owner/old-name']; // stale — the repo was renamed on GitHub
      S.data = [{ full_name: 'owner/new-name', pushed_at: '2026-01-01T00:00:00Z' }]; // resolved by fetchRepo()
      S.feedItems = [];
      S.feedEtag = '';

      const realFetch = window.fetch;
      window.fetch = async () => ({
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => ([{
          id: '1',
          type: 'PushEvent',
          repo: { name: 'owner/new-name' }, // GitHub reports the current name, not the stale one
          payload: { size: 1 },
          created_at: '2026-01-01T00:00:00Z',
        }]),
      });
      try {
        await pollEvents();
      } finally {
        window.fetch = realFetch;
      }
      return S.feedItems;
    });

    expect(feedItems).toHaveLength(1);
    expect(feedItems[0].repoName).toBe('new-name');
  });
});
