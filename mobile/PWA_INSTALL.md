# Install SpeedRead as an iPhone web app

SpeedRead can be exported as a fully client-side progressive web app. Its
application bundle, exercise content, fonts, and images are cached after the
first secure visit. Results and preferences remain in the browser's local
storage through React Native Async Storage.

## Build

```bash
npm install
npm run build:pwa
```

The complete static application is written to `dist/`. It can be hosted by any
static HTTPS host.

## GitHub Pages

The production site is deployed automatically from `main` to:

`https://mherdv.github.io/speed-reading-mobile-app/`

The deployment workflow sets `GITHUB_PAGES_BASE_URL` while exporting so Expo's
JavaScript and asset paths include the repository subdirectory. The manifest
and service worker use scope-relative URLs, so the same PWA build also works at
a root domain or another HTTPS subdirectory.

For a production-like check on the same Mac:

```bash
npm run serve:pwa
```

`localhost` belongs to the device opening it. An iPhone cannot use the Mac's
`localhost`; it must use the Mac's network address or a hosted URL. A plain
`http://<mac-address>` page can display the app, but browsers require HTTPS for
service workers and reliable offline installation. Use an HTTPS host for the
installable version.

## Add it from Chrome on iPhone

1. Open the HTTPS SpeedRead address in Chrome.
2. Tap **Share**.
3. Tap **Add to Home Screen**.
4. Confirm **SpeedRead** and tap **Add**.
5. Launch it once while online so every cached application asset is available.

Safari supports the same flow through **Share → Add to Home Screen → Open as
Web App**.

## Offline and update behavior

- The installed app shell and built-in exercises work offline after the first
  successful load.
- Results, progress, difficulty preferences, and the Today plan stay only on
  that browser profile/device.
- Power Reader's online book search, downloads, and translation require a
  network connection unless the relevant content was already stored by the
  application.
- Opening the app while online checks for the newest deployed build. Old
  versioned application caches are removed after the new worker activates.
- Clearing website data or deleting the web app can remove local progress.
