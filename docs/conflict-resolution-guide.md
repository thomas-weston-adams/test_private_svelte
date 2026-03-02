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
