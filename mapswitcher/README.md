# Map Switcher Widget for ArcGIS Experience Builder

A dropdown widget for ArcGIS Experience Builder that lets users jump between separate
Experience Builder applications while keeping the current map view. When a destination is
selected, the widget reads the current URL hash (center, zoom, scale, rotation, and spatial
reference) and appends it to the destination URL, so the next app opens at the same location.

## Features

- Dropdown list of destination apps, configured in the widget settings panel.
- Preserves the map view by carrying the URL hash to the destination. Center point, zoom
  level, scale, and rotation all come across.
- Works with any coordinate system (Web Mercator, State Plane, WGS84, and others), because
  it passes through whatever is already in the hash.
- Carries the current basemap to the destination app (optional). Works with the Esri Basemap
  Gallery and Basemap Gallery Custom: portal item basemaps, Esri well-known basemaps, and
  basemaps added by URL. Select a map widget in settings to turn it on. The destination app
  needs its own Map Switcher connected to its map to apply the basemap.
- Map widget connection is optional. Without one, only the extent is carried.
- Add, remove, and reorder sites (move up / move down) in the settings panel.
- Built for accessibility: screen reader announcements on focus and navigation, an
  associated label and description, keyboard support, and a busy state while navigating.

## Requirements

- ArcGIS Experience Builder Developer Edition 1.21.
- Experience Builder 1.18 and earlier run React 18 and are not supported.

This widget uses only the Experience Builder framework modules (jimu-core, jimu-ui and
jimu-arcgis) and the ArcGIS Maps SDK that ships with Experience Builder. It
pulls in no third-party npm packages, so there is nothing extra to install beyond the normal
Experience Builder client install.

## Install

1. Download `mapswitcher.zip` from the latest release.
2. Extract it. You get a single folder named `mapswitcher`.
3. Copy the `mapswitcher` folder into your Experience Builder client extensions folder so the
   final path is:

   ```
   client\your-extensions\widgets\mapswitcher\manifest.json
   ```

   The `manifest.json` must sit directly inside `your-extensions\widgets\mapswitcher\`. Do not
   nest it a second level deep (for example `widgets\mapswitcher\mapswitcher\`). Nesting is the
   most common reason a widget fails to register.
4. From the `client` folder, run:

   ```
   npm install
   ```

   Experience Builder installs any widget dependencies automatically for widgets in the
   `your-extensions` folder. This widget has no third-party dependencies, so this step is just
   the standard client install you already run.
5. Start (or restart) the development server from the `client` folder:

   ```
   npm start
   ```
6. In the builder, drag the Map Switcher widget into your experience. Open its settings and add
   one site per destination app, filling in a Label (the text shown in the dropdown) and the
   full URL of the target Experience Builder application.

7. To carry the basemap, open the Basemap section in settings, select the map widget, and
   leave "Carry basemap to next map" on. Do the same in every destination app.

### How the basemap carries over

On switch, the widget adds `ms_basemap` (and `ms_portal` for portal item basemaps) to the
destination URL. The destination Map Switcher applies that basemap once its map loads, then
removes the parameters from the address bar so a refresh does not re-apply it. If Basemap
Gallery Custom in the destination app has a default basemap set, the carried basemap still
wins. A carried basemap only loads from Esri hosts, the app's own domain, the app portal's
domain, or a portal a Basemap Gallery Custom widget in the app points at.

### The release zip and the editor shims

The zip is the widget only. The Visual Studio type shims in the repo (`mapswitcher/src/exb-editor-shims.d.ts`, `mapswitcher/src/vendor-shims.d.ts`) are left out on purpose: their ambient `declare module` blocks are not file-scoped and would rewrite the react, jimu and esri types for every other widget in your `your-extensions` folder.

If you clone the repository instead of using the zip, delete `mapswitcher/src/exb-editor-shims.d.ts` and the other shim files listed above before building; nothing else depends on them.

## Usage telemetry

This widget records anonymous usage counts and errors so the GIS Division can see which widgets and versions are in use and which errors users hit. It records the app id and title, widget name and version, the action name, a truncated error message, the site host name and browser family. It never records usernames, coordinates, addresses, attribute values or URLs with query strings. Where the data goes: on page load the widget asks the app's portal for a public item tagged `exb-beacon-sink` and posts to that table. If your portal has no such item, nothing is sent anywhere. To turn it off for an app, set `"telemetry": false` in the widget's config, or users can enable Do Not Track in their browser. The shared module is `src/shared/beacon.ts`.

## Troubleshooting: `mapswitcher is duplicated`

If `npm start` stops with `mapswitcher is duplicated`, Experience Builder found two copies of the
widget registered under the same name. A single, correctly placed copy cannot duplicate itself,
so a second copy is present somewhere. Check, in this order:

1. A nested folder: `widgets\mapswitcher\mapswitcher\`. The `manifest.json` must sit directly
   inside `widgets\mapswitcher\`, not a level deeper. This is the usual cause when a zip is
   extracted into a folder that already has the widget's name.
2. A leftover folder from an earlier build or version, including any `-copy` folder or a folder
   under a previous name if the widget was renamed.
3. A stale compiled build in `client\dist\widgets\mapswitcher`. Stop the client server, delete
   that folder (or run a clean build), then start again.

Tell for the nesting case: if removing one copy makes the widget vanish from the build entirely,
the copy that remains is nested too deep. Move it so `manifest.json` is directly inside the
widget folder.

## Feedback

Questions, issues, and suggestions are welcome on the Esri Community post:
https://community.esri.com/t5/experience-builder-custom-widgets/map-switcher-widget-for-arcgis-experience-builder/ba-p/1665696

## License

Apache-2.0. Copyright City of Grand Junction, CO. See the `LICENSE` file.

## Changelog

- 2026-10-02 v1.1.0: Basemap carries to the destination app (see `CHANGELOG.md`)
- 2026-06-11 v1.0.1: Security fixes for CodeQL code scanning alerts
