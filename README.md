# Life RPG

Turn real life into an RPG. Log real activities, earn XP in 12 skills, collect 288 items and pets.
Solo v1: everything is saved on the device (localStorage), with Backup/Restore in Settings.

Plain HTML/CSS/JS, no build step.

## Run locally

```bash
node serve.mjs
```

Then open http://localhost:5173.

## Deploy (free)

- **GitHub Pages:** push to `main` on GitHub. In the repo go to Settings → Pages → Source: **GitHub Actions** (one time). `.github/workflows/deploy.yml` then publishes every push.

Once it's live on https, open it on your phone and use "Add to Home Screen".

## Updates

Installed copies check `version.json` (on open, on return to the app, and every 5 minutes) and reload
themselves when it changes. On GitHub Pages the deploy workflow stamps it with the commit id; locally
`serve.mjs` reports the newest file change, so open copies reload within ~2 seconds of an edit.
They never reload while a pop-up (e.g. the log screen) is open. Progress is untouched by updates.

## Where things live

- `js/data.js` – skills, unit lengths, rarities, boost values, every item list
- `js/game.js` – level curve, drop rolls, boosts, selling, save/load
- `js/sprites.js` – placeholder pixel art (generated from item names)
- `js/app.js` – screens and the logging flow
- `sw.js` – offline caching
