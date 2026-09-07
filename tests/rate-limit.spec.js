// @ts-check
const { test, expect } = require('@playwright/test');

// GitHub returns X-RateLimit-* headers on every API response — capturing
// them off calls Smokey already makes (rather than a dedicated call to
// /rate_limit) costs nothing extra. Added so a user watching many repos
// can see how close they are to the hourly cap without guessing.

function fakeResponse(headers) {
  const map = new Map(Object.entries(headers));
  return { headers: { get: (k) => (map.has(k) ? map.get(k) : null) } };
}

// index.html's own init() fires real, unauthenticated fetchRepo() calls
// against api.github.com for the default repo list the instant the page
// loads — regardless of whether a PAT is set. Those real responses carry
// real X-RateLimit-* headers and race against this file's own captures,
// so every test here blocks that traffic before navigating: otherwise a
// real response landing after a test's fake one silently overwrites
// S.rateLimit/#rateLimitBar with live data (this is exactly what made the
// suite flake in CI: real unauthenticated data of "60/60" clobbered a
// test's fake "187/5,000").
async function blockGitHubApi(page) {
  await page.route('https://api.github.com/**', (route) => route.abort());
}

test.describe('captureRateLimit', () => {
  test.beforeEach(async ({ page }) => {
    await blockGitHubApi(page);
    await page.goto('/index.html');
  });

  test('parses the rate-limit headers into S.rateLimit and shows the bar', async ({ page }) => {
    const resetIn600s = Math.floor(Date.now() / 1000) + 600;
    const state = await page.evaluate((reset) => {
      captureRateLimit({
        headers: {
          get: (k) => ({
            'X-RateLimit-Limit': '5000',
            'X-RateLimit-Remaining': '4813',
            'X-RateLimit-Reset': String(reset),
          }[k] ?? null),
        },
      });
      return S.rateLimit;
    }, resetIn600s);

    expect(state).toEqual({ limit: 5000, remaining: 4813, reset: resetIn600s });

    const bar = page.locator('#rateLimitBar');
    await expect(bar).toBeVisible();
    await expect(bar).toHaveText('GitHub API: 187 / 5,000 used this hour · resets in 10m');
  });

  test('does nothing when the response has no rate-limit headers', async ({ page }) => {
    const result = await page.evaluate(() => {
      const before = S.rateLimit;
      captureRateLimit({ headers: { get: () => null } });
      return { before, after: S.rateLimit };
    });

    expect(result.before).toBeNull();
    expect(result.after).toBeNull();
    await expect(page.locator('#rateLimitBar')).toBeHidden();
  });
});

test.describe('renderRateLimit', () => {
  test.beforeEach(async ({ page }) => {
    await blockGitHubApi(page);
    await page.goto('/index.html');
  });

  test('hides the bar when there is no rate-limit data yet', async ({ page }) => {
    await page.evaluate(() => { S.rateLimit = null; renderRateLimit(); });
    await expect(page.locator('#rateLimitBar')).toBeHidden();
  });

  test('formats used/limit and rounds the reset countdown to the nearest minute', async ({ page }) => {
    // 100s is comfortably clear of the 90s (1.5m) rounding boundary, so a
    // few hundred ms of round-trip latency to page.evaluate can't flip it.
    const resetIn100s = Math.floor(Date.now() / 1000) + 100;
    await page.evaluate((reset) => {
      S.rateLimit = { limit: 60, remaining: 55, reset };
      renderRateLimit();
    }, resetIn100s);

    await expect(page.locator('#rateLimitBar')).toHaveText('GitHub API: 5 / 60 used this hour · resets in 2m');
  });
});

test.describe('fetchRepo captures rate limit from its own request', () => {
  test.beforeEach(async ({ page }) => {
    await blockGitHubApi(page);
    await page.goto('/index.html');
  });

  test('updates S.rateLimit after a normal fetchRepo call', async ({ page }) => {
    const resetIn5m = Math.floor(Date.now() / 1000) + 300;
    const rateLimit = await page.evaluate(async (reset) => {
      const realFetch = window.fetch;
      window.fetch = async (url) => {
        if (String(url).endsWith('/repos/owner/repo')) {
          return {
            ok: true,
            headers: {
              get: (k) => ({
                'X-RateLimit-Limit': '60',
                'X-RateLimit-Remaining': '59',
                'X-RateLimit-Reset': String(reset),
              }[k] ?? null),
            },
            json: async () => ({ full_name: 'owner/repo', pushed_at: '2026-01-01T00:00:00Z' }),
          };
        }
        return { ok: false, status: 404, headers: { get: () => null } };
      };
      try {
        await fetchRepo('owner/repo', {});
      } finally {
        window.fetch = realFetch;
      }
      return S.rateLimit;
    }, resetIn5m);

    expect(rateLimit).toEqual({ limit: 60, remaining: 59, reset: resetIn5m });
  });
});
