# Conflict Resolution Guide (KYEM Training Calendar)

If GitHub shows **"This branch has conflicts that must be resolved"**, use one of these paths.

## Fastest path (GitHub UI)

1. Open the PR.
2. Click **Resolve conflicts**.
3. For each file, remove markers:
   - `<<<<<<< HEAD`
   - `=======`
   - `>>>>>>> branch-name`
4. Keep the newer KYEM calendar implementation in `svelte-app/src/App.svelte`:
   - full-row desktop table layout
   - mobile stacked row behavior
   - nested **Add to calendar** options
   - registration re-selection modal
5. Click **Mark as resolved** for each file.
6. Click **Commit merge**.

## Local path (recommended if conflicts are large)

```bash
# from your feature branch
git fetch origin
git merge origin/main
```

Then resolve conflicts in files Git reports, for example:

```bash
git status
```

After editing conflicted files:

```bash
git add svelte-app/src/App.svelte .github/workflows/deploy-pages.yml svelte-app/README.md
git commit
# then push your branch
git push
```

## What to keep if `App.svelte` conflicts

Prefer these behaviors from the latest branch version:

- **Eastern-safe date handling** for export date math (`addDaysToIsoDate`) to avoid UTC rollovers.
- Calendar providers nested under **Add to calendar**.
- Full-row desktop table and mobile stacked layout.
- Registration modal requiring explicit class reselection.

## Validate before merging

```bash
cd svelte-app
npm run build
```

If build succeeds, return to PR and complete merge.

## Conflict decisions for `test_private_svelte` PR #33 and PR #34

I could not directly fetch/push those PR branches from this environment due network access restrictions to GitHub, so here are the exact decisions to apply.

### Keep these versions when conflicts appear

- `svelte-app/src/App.svelte`: **keep the latest branch content from this workstream** (includes: Eastern-safe date handling, nested calendar actions, responsive table/mobile layout, ADA improvements, and integrated registration-form alternative).
- `.github/workflows/deploy-pages.yml`: keep version that runs PR build checks and deploys only on non-PR events.
- `svelte-app/README.md`: keep latest with Pages troubleshooting + “PR branch not deployed” notes.
- `docs/conflict-resolution-guide.md`: keep newest (this file), since it includes updated conflict guidance.

### Local commands to resolve PR #33

```bash
git fetch origin

git checkout <branch-for-pr-33>
git merge origin/main

# If conflicts are mostly expected to prefer your branch implementation for core files:
git checkout --ours svelte-app/src/App.svelte .github/workflows/deploy-pages.yml svelte-app/README.md docs/conflict-resolution-guide.md

# Then manually review any remaining conflicts in other files, save, and stage:
git add -A
npm --prefix svelte-app run build
git commit -m "Resolve merge conflicts for PR #33 using latest KYEM prototype decisions"
git push
```

### Local commands to resolve PR #34

```bash
git fetch origin

git checkout <branch-for-pr-34>
git merge origin/main

git checkout --ours svelte-app/src/App.svelte .github/workflows/deploy-pages.yml svelte-app/README.md docs/conflict-resolution-guide.md

git add -A
npm --prefix svelte-app run build
git commit -m "Resolve merge conflicts for PR #34 using latest KYEM prototype decisions"
git push
```

### Why this conflict policy

It preserves the most complete and current implementation from this prototype stream:
- integrated registration replacement for legacy Logiforms UX,
- accessibility improvements (skip link, focus states, semantic table/dialog labels),
- Eastern-safe event/date handling,
- stable GitHub Pages behavior with PR build validation + main-only deploy.


## Exact web-editor choices for PR #33 and #34 (based on your screenshots)

In the GitHub conflict editor for **both** PRs:

1. Open `.github/workflows/deploy-pages.yml`
   - At the conflict block shown near the `on:` section, choose **Accept current change** so the `pull_request` trigger stays present.
   - Ensure final `on:` includes all three events:
     - `push` on `main`
     - `pull_request` on `main`
     - `workflow_dispatch`

2. Open `svelte-app/README.md`
   - Choose **Accept current change** for conflict blocks so the latest deployment troubleshooting notes remain.
   - Keep sections about:
     - why PR branches are not deployed,
     - how to find the Pages URL,
     - hard refresh/incognito checks.

3. Open `svelte-app/src/App.svelte`
   - Choose **Accept current change** for all conflict blocks.
   - This preserves the newest integrated registration alternative and ADA/Eastern-date updates.

4. Click **Mark as resolved** for each file.
5. Click **Commit merge**.
6. Re-run PR checks; if green, merge PR.

### Post-merge verification

- Open **Actions → Deploy Svelte app to GitHub Pages**.
- Confirm `build` and `deploy` jobs are successful.
- Open the `deploy` job URL and verify updated UI elements are visible.
