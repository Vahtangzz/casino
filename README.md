# School Games Portal

A lightweight, school-friendly browser game portal. Pure HTML/CSS/vanilla JS,
no build step, no server required to play — designed to be hosted directly on
GitHub Pages.

## Running it locally

This is a static site. Any static file server works — don't open `index.html`
directly via `file://`, since some browsers restrict `localStorage` there.

```bash
# from this folder
python -m http.server 8000
# then open http://localhost:8000
```

## Deploying to GitHub Pages

1. Push this folder to a GitHub repo.
2. Repo Settings → Pages → Source: deploy from the `main` branch, root folder.
3. Your site will be live at `https://<username>.github.io/<repo>/`.

No further configuration needed — everything here is static.

## Account system

**This site ships with local, browser-only accounts (Option A).** There is no
server, so "signing up" creates an account saved in `localStorage` on that
one browser/device — it is not a cloud account and does not sync across
devices. This is disclosed in the sign-up modal and on the profile page.

- Passwords are never stored in plain text. They're run through
  PBKDF2-SHA256 (120,000 iterations, random per-user salt, via the browser's
  native Web Crypto API) before being saved. This protects against casually
  reading the saved data, but — being entirely client-side — it cannot
  protect against someone with direct access to the browser's storage. That
  limitation is inherent to any account system built on static hosting, and
  is disclosed to users rather than hidden.
- A logged-in session persists across refreshes and browser restarts on the
  same browser (`js/storage.js`, `sgp_session_v1`).
- **Export / Import**: the profile page can export the full account (coins,
  XP, achievements, favorites, high scores, settings — password hash and
  salt included) as a downloadable JSON file, and import it back on any
  other browser/device to continue there. This is the supported way to move
  an account between computers.
- **Guest play**: anyone can play any game immediately without an account.
  Guest progress lives only in `sessionStorage` for that tab and is not
  recoverable after the tab closes — this is shown in the UI, so guests are
  never misled into thinking it's saved.

### Adding a real cloud backend later (Option B)

No backend credentials were available when this was built, so cloud sync
isn't wired up — but the code is structured so it can be added without a
rewrite:

- All account reads/writes already go through one module, `js/storage.js`
  (`SGP.getCurrentAccount`, `SGP.updateCurrentAccount`, etc.) and one auth
  module, `js/auth.js`. To add Supabase/Firebase, you'd swap the bodies of
  those functions to call the backend's SDK instead of `localStorage`,
  without touching any game code (all 16 games only ever call the shared
  `SGPGame` / `SGP` APIs, never `localStorage` directly).
- Recommended shape once you have a project: Supabase Auth for email/password
  (it already handles secure hashing server-side), a `profiles` table keyed
  by `user.id` holding the same JSON shape as `SGP.defaultAccount()`, and
  row-level security so a user can only read/write their own row.
- Until that's wired up, keep the local system as the fallback for anyone
  visiting without a configured backend, so the site never breaks.

## Settings that actually change behavior

- **School Mode** (profile → Settings): forces audio off regardless of the
  Sound toggle (`SGPGame.audioAllowed()`), and hides elements marked
  `.decorative-fx`.
- **Performance Mode** (Low/Medium/High): read by each game/`css/style.css`
  via `SGPGame.particleScale()` and the `perf-*` classes on `<html>` — Low
  disables transition/animation durations outright via CSS custom
  properties, Medium/High scale effect density.

Both are applied instantly (no reload) and persist per account (or per
guest session).

## Project structure

```
index.html          Home portal: search, filters, quick-play tags, game grid
profile.html         Profile: stats, achievements, favorites, high scores, settings
css/style.css        Shared design system
js/storage.js         Local account storage (accounts, session, export/import)
js/auth.js             Password hashing, sign up / log in / log out / guest
js/achievements.js      Achievement definitions + unlock evaluation
js/games-data.js         Game registry (metadata used by grid + filters)
js/ui.js                  Shared header, toasts, modals, settings application
js/game-api.js             Per-game helper (coins/XP/highscore/favorite/audio/perf)
js/home.js                  index.html logic
js/profile.js                 profile.html logic
games/*.html          16 self-contained game pages
```

## Games

Snake, Flap Dash, Reaction Test, Aim Trainer, Memory Match, 2048,
Minesweeper, Tic-Tac-Toe (local 2-player), Coin Clicker, Breakout, Lane
Racer, Dodge Storm, Blackjack, Roulette, Slots, Coin Flip.

The four casino-style games (Blackjack, Roulette, Slots, Coin Flip) use only
the site's virtual coin currency — there is no real-money functionality
anywhere in this project.

All games support keyboard controls and on-screen touch controls for
mobile, and report results back through `js/game-api.js` so coins, XP,
level, high scores and achievements update immediately on the shared
header and profile page.
