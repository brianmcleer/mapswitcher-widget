# mapswitcher-widget

[![License](https://img.shields.io/github/license/brianmcleer/mapswitcher-widget)](LICENSE) [![Release](https://img.shields.io/github/v/release/brianmcleer/=tag)](https://github.com/brianmcleer/mapswitcher-widget/releases) [![Issues](https://img.shields.io/github/issues/brianmcleer/mapswitcher-widget)](https://github.com/brianmcleer/mapswitcher-widget/issues)

Source repo for the **Map Switcher** custom widget for ArcGIS Experience Builder, by Brian
McLeer (City of Grand Junction, CO).

The Map Switcher widget gives users a dropdown to move between separate Experience Builder
applications while preserving the current map view. It reads the URL hash from the source app
(center, zoom, scale, rotation, spatial reference) and appends it to the destination URL, so the
next app opens at the same location. It works with any coordinate system and needs no map widget
connection.

- Esri Community post: https://community.esri.com/t5/experience-builder-custom-widgets/map-switcher-widget-for-arcgis-experience-builder/ba-p/1665696
- Downloads (releases): https://github.com/brianmcleer/mapswitcher-widget/releases

For install steps, features, and troubleshooting, see the README inside the `mapswitcher`
folder. That README travels with the widget when someone downloads a release.

## Repo layout

```
mapswitcher-widget/            <- this repo
â”œâ”€â”€ README.md                  <- this file (GitHub landing page)
â”œâ”€â”€ LICENSE                    <- Apache-2.0
â”œâ”€â”€ .gitignore                 <- ignores node_modules, .vs, dist, OS cruft
â”œâ”€â”€ publish.ps1                <- one-command publish / update script
â””â”€â”€ mapswitcher/               <- the widget (drops into your-extensions\widgets)
    â”œâ”€â”€ package.json
    â”œâ”€â”€ package-lock.json      <- generated in the EB environment (see below)
    â”œâ”€â”€ manifest.json
    â”œâ”€â”€ config.json
    â”œâ”€â”€ icon.svg
    â”œâ”€â”€ README.md
    â”œâ”€â”€ LICENSE
    â”œâ”€â”€ .gitignore
    â”œâ”€â”€ .npmignore
    â””â”€â”€ src/ ...
```

## Compatibility

Built and tested on Experience Builder Developer Edition 1.19 and 1.20 (React 19). EB 1.18 and
earlier (React 18) are not supported.

## Publishing and updates

The `mapswitcher` subfolder is kept in sync with the live widget in your Experience Builder
install by `publish.ps1`. The script mirrors the EB widget folder into this repo (skipping
`node_modules` and `.vs`), commits, pushes to GitHub, and optionally cuts a versioned release
with a downloadable zip.

Edit the three variables at the top of `publish.ps1` (`$WidgetName`, `$RepoName`,
`$ExbWidgetPath`) so they match your machine, then run from a terminal opened in this repo
folder:

```
# Code update only
powershell -ExecutionPolicy Bypass -File .\publish.ps1

# Code update plus a new downloadable version
powershell -ExecutionPolicy Bypass -File .\publish.ps1 -Release v1.1.0
```

Because the script mirrors from the EB folder, the standardized widget files (package.json,
README.md, LICENSE, .gitignore, .npmignore, and the updated manifest.json) must also exist in
the EB widget folder. Otherwise the mirror step removes them from this repo on the next run.

### Lockfile

`package-lock.json` is generated in the real Experience Builder environment, not by hand, so it
reflects the exact tested versions. In the EB widget folder run `npm install` once, confirm the
widget still builds and runs, then let `publish.ps1` carry the lockfile into the repo. This
widget has no third-party dependencies, so the lockfile is small.

## License

Apache-2.0. Copyright City of Grand Junction, CO. See `LICENSE`.

### The release zip and the editor shims

The zip is the widget only. The Visual Studio type shims in the repo (`mapswitcher/src/exb-editor-shims.d.ts`, `mapswitcher/src/vendor-shims.d.ts`) are left out on purpose: their ambient `declare module` blocks are not file-scoped and would rewrite the react, jimu and esri types for every other widget in your `your-extensions` folder.

If you clone the repository instead of using the zip, delete `mapswitcher/src/exb-editor-shims.d.ts` and the other shim files listed above before building; nothing else depends on them.

