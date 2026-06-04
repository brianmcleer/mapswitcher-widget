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
- No map widget connection required.
- Add, remove, and reorder sites (move up / move down) in the settings panel.
- Built for accessibility: screen reader announcements on focus and navigation, an
  associated label and description, keyboard support, and a busy state while navigating.

## Requirements

- ArcGIS Experience Builder Developer Edition 1.19 or 1.20 (these run React 19).
- Experience Builder 1.18 and earlier run React 18 and are not supported.

This widget uses only the Experience Builder framework modules (jimu-core and jimu-ui). It
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
