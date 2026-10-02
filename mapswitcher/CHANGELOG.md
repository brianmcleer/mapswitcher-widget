# Changelog

Newest first. Every release bumps `manifest.json` and `package.json` together.

## 1.1.3 (2026-10-02)

- Console: removed every `[MapSwitcher]` debug message. The widget writes nothing to the browser console; errors still go to the beacon.

## 1.1.2 (2026-10-02)

- Fixed: the destination app showed its own basemap for a moment before switching to the carried one. The carried basemap now starts loading as soon as the map view exists and goes on the map right away, instead of waiting for the view and the basemap item to finish loading first. If the carried basemap fails to load, the app's own basemap is put back.

## 1.1.1 (2026-10-02)

- Fixed: basemap did not carry when no map widget was picked in settings. The widget now falls back to the first Map widget in the app.
- Fixed: the carried basemap is read the moment the widget loads and also saved to localStorage (`ms-basemap-carry`, 2 minute life) before navigating, so it still arrives on the same host if the URL query gets dropped during app start.
- Added: the destination publishes the carried basemap to `sessionStorage` (`ms-basemap-handoff`) and `window.__msBasemapHandoff` so Basemap Gallery Custom 1.21.9+ uses it instead of its default basemap.
- Added: console messages prefixed `[MapSwitcher]` show what was carried, what arrived, and why a basemap was skipped.

## 1.1.0 (2026-10-02)

- Added: the current basemap carries to the destination app. Works with basemaps chosen in the Esri Basemap Gallery and in Basemap Gallery Custom (portal items, Esri well-known basemaps, and basemaps added by URL). The source app adds `ms_basemap` (and `ms_portal` for portal items) to the destination query string; the destination Map Switcher applies it once its map loads, then removes the parameters from the address bar.
- Added: settings now have a Basemap section with a map widget selector and a "Carry basemap to next map" switch (on by default). With no map selected, behavior is unchanged: extent only.
- Added: if Basemap Gallery Custom has a default basemap set, the destination Map Switcher puts the carried basemap back once if the gallery's one-time default lands after the restore (30 second window).
- Security: a carried basemap only loads from Esri hosts, the app's own domain, the app portal's domain, or a portal a Basemap Gallery Custom widget in the app points at. Item ids and well-known ids are pattern-checked.
- Manifest: added `jimu-arcgis` dependency.

## 1.0.5 (2026-09-18)

- Security: the beacon's session id now falls back to `crypto.getRandomValues` and then to a clock value instead of `Math.random`, which CodeQL flags as insecure randomness (shared beacon 1.1.1). The id only groups one page load's events; it is never a secret or a credential.
- Build: `tsconfig.json` is `jsx: react-jsx` with `jsxImportSource: @emotion/react`, matching the Experience Builder client. ts-loader reads the widget tsconfig, and the previous classic `jsx: react` setting made the settings panel and runtime fail with "Cannot convert undefined or null to object" after a full rebuild. No functional change.

## 1.0.4 (2026-09-18)

- Added: anonymous usage and error telemetry (shared beacon module; off unless the portal publishes an exb-beacon-sink table; telemetry: false in config disables it).

## 1.0.3 (2026-09-17)

- Packaging: removed `src/emotion-jsx-runtime.d.ts`; the master editor shim already declares `@emotion/react/jsx-runtime` and the release zip must not carry an ambient copy.

## 1.0.2 (2026-09-17)

- Packaging: the Visual Studio editor shims are no longer in the release zip. `publish.ps1` strips them from a staging copy (`$ReleaseOnlyExclude`) and refuses to zip if any ambient `declare module` of react, jimu or esri survives. The shims stay in the GitHub repo; clone users delete them before building.
- Editor: widget-level `tsconfig.json` moved to the self-contained mode B setup for Experience Builder 1.21 (pnpm): no `paths`, `"types": []`, master `src/exb-editor-shims.d.ts` copied from `widgets\_vs`, widget-specific declarations in `src/vendor-shims.d.ts`. `npx tsc -p .` reports 0 errors. Webpack output is unchanged (jsx settings kept).

## Earlier releases

See the GitHub releases page and the changelog section of the README, if any.
