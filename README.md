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

- **GitHub Pages:** push this folder to a GitHub repo → Settings → Pages → deploy from branch `main`, folder `/`.
- **Netlify:** drag this folder onto https://app.netlify.com/drop.

Once it's live on https, open it on your phone and use "Add to Home Screen".

## Where things live

- `js/data.js` – skills, unit lengths, rarities, boost values, every item list
- `js/game.js` – level curve, drop rolls, boosts, selling, save/load
- `js/sprites.js` – placeholder pixel art (generated from item names)
- `js/app.js` – screens and the logging flow
- `sw.js` – offline caching
