# India–USA Performing Arts Initiative · Research Dossier

A static research-dossier website built from the markdown + JSON content package
`india-usa-festival-research-plan-v2.zip`. Deployed via GitHub Pages.

## Live site
Once this branch is merged to `main` and Pages is enabled in the repo settings
(Settings → Pages → Source: **GitHub Actions**), the workflow
`.github/workflows/pages.yml` publishes the site under `site/` to Pages on every
push to `main`.

## Structure
```
site/
├── index.html              # SPA shell
├── assets/
│   ├── styles.css          # Theme: saffron / green / navy on cream
│   └── app.js              # Hash router, markdown + JSON views
├── content/                # Markdown sources (single source of truth)
└── data/                   # JSON sources
```

## Local dev
```bash
cd site && python3 -m http.server 8080
# open http://localhost:8080
```

The app uses hash routing (`#/programs`, `#/stakeholders`, etc.), so it works
from any static host with no build step. Markdown is rendered client-side via
`marked` from a CDN.

## Editing content
All content is in `site/content/*.md` and `site/data/*.json`. The site is a
view over these files — there is no CMS.

## Privacy note
Classic GitHub Pages is public unless you are on GitHub Enterprise Cloud with a
private Pages plan. To restrict access, either make the whole repo private on
GitHub Enterprise Cloud, or serve the `site/` folder from a private host
(Cloudflare Access, Netlify with password, etc.).
