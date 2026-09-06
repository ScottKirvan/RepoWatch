// @ts-check
const { test, expect } = require('@playwright/test');

// Covers the CI workflow classification added in d2aec5a (red/yellow/green)
// and 518ba2f (ice = blocked/waiting for approval). No test existed for
// either at the time.

function run(name, conclusion, status) {
  return { name, conclusion, status };
}

async function classify(page, workflowRuns) {
  return page.evaluate(async (runs) => {
    const realFetch = window.fetch;
    window.fetch = async () => ({ ok: true, json: async () => ({ workflow_runs: runs }) });
    try {
      return await fetchWorkflowRuns('owner/repo', {});
    } finally {
      window.fetch = realFetch;
    }
  }, workflowRuns);
}

test.describe('CI workflow run classification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
  });

  test('a single failing workflow makes the whole repo red, even alongside green ones', async ({ page }) => {
    const result = await classify(page, [
      run('build', 'success', 'completed'),
      run('deploy', 'failure', 'completed'),
    ]);
    expect(result.level).toBe('red');
  });

  test('red outranks ice and yellow', async ({ page }) => {
    const result = await classify(page, [
      run('build', null, 'queued'),        // yellow
      run('lint', null, 'waiting'),         // ice
      run('deploy', 'timed_out', 'completed'), // red
    ]);
    expect(result.level).toBe('red');
  });

  test('ice (blocked/waiting) outranks yellow when nothing is red', async ({ page }) => {
    const result = await classify(page, [
      run('build', null, 'in_progress'),      // yellow
      run('deploy', null, 'action_required'), // ice
    ]);
    expect(result.level).toBe('ice');
  });

  test('all-success workflows classify as green', async ({ page }) => {
    const result = await classify(page, [
      run('build', 'success', 'completed'),
      run('deploy', 'neutral', 'completed'),
      run('lint', 'skipped', 'completed'),
    ]);
    expect(result.level).toBe('green');
  });

  test('dedupes by workflow name, keeping only the newest run per workflow', async ({ page }) => {
    // The API returns newest-first; an older failing "deploy" run must not
    // count once a newer, successful "deploy" run has been seen.
    const result = await classify(page, [
      run('deploy', 'success', 'completed'),
      run('build', 'success', 'completed'),
      run('deploy', 'failure', 'completed'),
    ]);
    expect(result.level).toBe('green');
    expect(result.workflows).toHaveLength(2);
    expect(result.workflows.map(w => w.name).sort()).toEqual(['build', 'deploy']);
  });

  test('no workflow runs classifies as none', async ({ page }) => {
    const result = await classify(page, []);
    expect(result).toEqual({ level: 'none', workflows: [] });
  });

  test('a failed API response yields null rather than throwing', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const realFetch = window.fetch;
      window.fetch = async () => ({ ok: false });
      try {
        return await fetchWorkflowRuns('owner/repo', {});
      } finally {
        window.fetch = realFetch;
      }
    });
    expect(result).toBeNull();
  });
});

test.describe('CI cell rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
  });

  test('shows a plain dot with a PAT hint when no PAT is configured', async ({ page }) => {
    const html = await page.evaluate(() => {
      S.pat = '';
      return ciCellHTML({ ci: null });
    });
    expect(html).toContain('Add a PAT in Settings');
    expect(html).not.toContain('ci-red');
  });

  test('renders the level-specific dot class once a PAT is set', async ({ page }) => {
    const html = await page.evaluate(() => {
      S.pat = 'fake-pat';
      return ciCellHTML({
        full_name: 'owner/repo',
        ci: { level: 'red', workflows: [{ name: 'deploy', conclusion: 'failure' }] },
      });
    });
    expect(html).toContain('ci-red');
    expect(html).toContain('deploy');
  });
});
