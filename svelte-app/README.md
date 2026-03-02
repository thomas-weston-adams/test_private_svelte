*Psst — looking for a more complete solution? Check out [SvelteKit](https://kit.svelte.dev), the official framework for building web applications of all sizes, with a beautiful development experience and flexible filesystem-based routing.*

*Looking for a shareable component template instead? You can [use SvelteKit for that as well](https://kit.svelte.dev/docs#packaging) or the older [sveltejs/component-template](https://github.com/sveltejs/component-template)*

---

# svelte app

This is a project template for [Svelte](https://svelte.dev) apps. It lives at https://github.com/sveltejs/template.

To create a new project based on this template using [degit](https://github.com/Rich-Harris/degit):

```bash
npx degit sveltejs/template svelte-app
cd svelte-app
```

*Note that you will need to have [Node.js](https://nodejs.org) installed.*


## Get started

Install the dependencies...

```bash
cd svelte-app
npm install
```

...then start [Rollup](https://rollupjs.org):

```bash
npm run dev
```

Navigate to [localhost:8080](http://localhost:8080). You should see your app running. Edit a component file in `src`, save it, and reload the page to see your changes.

By default, the server will only respond to requests from localhost. To allow connections from other computers, edit the `sirv` commands in package.json to include the option `--host 0.0.0.0`.

If you're using [Visual Studio Code](https://code.visualstudio.com/) we recommend installing the official extension [Svelte for VS Code](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode). If you are using other editors you may need to install a plugin in order to get syntax highlighting and intellisense.

## Building and running in production mode

To create an optimised version of the app:

```bash
npm run build
```

You can run the newly built app with `npm run start`. This uses [sirv](https://github.com/lukeed/sirv), which is included in your package.json's `dependencies` so that the app will work when you deploy to platforms like [Heroku](https://heroku.com).


## Single-page app mode

By default, sirv will only respond to requests that match files in `public`. This is to maximise compatibility with static fileservers, allowing you to deploy your app anywhere.

If you're building a single-page app (SPA) with multiple routes, sirv needs to be able to respond to requests for *any* path. You can make it so by editing the `"start"` command in package.json:

```js
"start": "sirv public --single"
```

## Using TypeScript

This template comes with a script to set up a TypeScript development environment, you can run it immediately after cloning the template with:

```bash
node scripts/setupTypeScript.js
```

Or remove the script via:

```bash
rm scripts/setupTypeScript.js
```

If you want to use `baseUrl` or `path` aliases within your `tsconfig`, you need to set up `@rollup/plugin-alias` to tell Rollup to resolve the aliases. For more info, see [this StackOverflow question](https://stackoverflow.com/questions/63427935/setup-tsconfig-path-in-svelte).

## Deploying to the web

### With [Vercel](https://vercel.com)

Install `vercel` if you haven't already:

```bash
npm install -g vercel
```

Then, from within your project folder:

```bash
cd public
vercel deploy --name my-project
```

### With [surge](https://surge.sh/)

Install `surge` if you haven't already:

```bash
npm install -g surge
```

Then, from within your project folder:

```bash
npm run build
surge public my-project.surge.sh
```

## Deploy this mirror to GitHub Pages

1. Push this repository to GitHub.
2. In your repo settings, enable **Pages** and select **GitHub Actions** as source.
3. The included workflow (`.github/workflows/deploy-pages.yml`) will build and publish automatically on pushes to `main`.

### GitHub Pages quick publish

This repo now includes a workflow at `.github/workflows/deploy-pages.yml` to publish `svelte-app/public` to GitHub Pages on pushes to `main`.

After pushing to GitHub:
1. Open **Settings → Pages**
2. Set source to **GitHub Actions**
3. Visit the URL shown in the Actions deploy job


## Use a separate repo (recommended)

Yes — this is a good idea to avoid impacting any other project history.

1. Create a new GitHub repo (for example: `kyem-training-calendar-mirror`).
2. From your local clone, add the new repo as a second remote:
   ```bash
   git remote add mirror https://github.com/<your-org>/<new-repo>.git
   ```
3. Push this project to that remote:
   ```bash
   git push mirror HEAD:main
   ```
4. In the new repo, enable **Settings → Pages → GitHub Actions**.
5. Push future updates to the new repo remote so deployment and history stay isolated.

Tip: if you want this repo to only track the new destination, replace `origin` instead of adding `mirror`.


### Why a PR branch says "not deployed"

- This is expected: GitHub Pages deploy runs on pushes to `main`.
- Pull requests now run a **build check** only (no Pages deploy), so you still get validation on the PR.
- If you see "This branch has conflicts that must be resolved", merge/rebase `main` into your branch first, then re-run checks.
- After merge to `main`, open **Actions → Deploy Svelte app to GitHub Pages → deploy** and use the published URL.


### If you still do not see updates on the live site

1. Confirm the commit is merged into `main` (PR branches are not deployed).
2. In **Actions**, open the latest deploy run and verify both `build` and `deploy` jobs succeeded.
3. Open **Settings → Pages** and confirm the published URL points to this repo.
4. Hard-refresh the browser (`Ctrl+Shift+R` / `Cmd+Shift+R`) to bypass cached assets.
5. If needed, open the site in an incognito window to verify fresh content.


## Exact step-by-step to view the live site

Follow these exact clicks in GitHub:

1. Open your repository: `https://github.com/thomas-weston-adams/test_private_svelte`
2. Click **Settings** → **Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions** (save if prompted).
4. Merge your PR into `main` (Pages deploy runs from `main`).
5. Click **Actions**.
6. Click workflow **Deploy Svelte app to GitHub Pages**.
7. Open the latest run on `main`.
8. Confirm both jobs are green:
   - `build`
   - `deploy`
9. Click the **deploy** job.
10. Click the `github-pages` environment URL shown in that job.

### If you still do not see new changes

1. Hard refresh the live page:
   - Windows/Linux: `Ctrl+Shift+R`
   - Mac: `Cmd+Shift+R`
2. Open in an incognito/private window.
3. Verify you are looking at the right URL format:
   - `https://thomas-weston-adams.github.io/test_private_svelte/`
4. Re-open Actions and ensure the latest run is for the newest merge commit on `main`.


## Force the latest prototype live (override bad conflict resolutions)

If conflict resolution accidentally kept old code, use this to publish the **latest conversation version**.

```bash
# 1) Make sure your local branch with latest work is up to date
git checkout work
git pull --ff-only

# 2) Move to main and update it
git checkout main
git pull --ff-only

# 3) Replace key files on main with the latest prototype versions from `work`
git checkout work -- svelte-app/src/App.svelte svelte-app/src/trainings.json .github/workflows/deploy-pages.yml svelte-app/README.md

# 4) Commit and push
git add svelte-app/src/App.svelte svelte-app/src/trainings.json .github/workflows/deploy-pages.yml svelte-app/README.md
git commit -m "Restore latest KYEM prototype baseline after conflict resolution"
git push origin main
```

After push, open **Actions → Deploy Svelte app to GitHub Pages** and use the URL from the `deploy` job.
