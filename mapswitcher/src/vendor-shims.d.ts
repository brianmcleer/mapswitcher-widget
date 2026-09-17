// vendor-shims.d.ts
// City of Grand Junction GIS Division
//
// Widget-specific editor declarations for the Map Switcher widget. Sits beside
// the untouched master copy of exb-editor-shims.d.ts (copied from widgets\_vs)
// so the master can stay byte-identical across widgets. Editor only: emits
// nothing, the Experience Builder webpack build never reads this file.
//
// Keep this file a script (no top-level import/export) so every block below
// stays ambient and merges with the master shim's declarations.

// The master shim declares 'jimu-for-builder' in shorthand form, which makes
// AllWidgetSettingProps a namespace rather than a type (TS2709). Give it a shape.
declare module 'jimu-for-builder' {
    export type AllWidgetSettingProps<T = any> = {
        id: string
        config: T & { set: (key: any, value: any) => any; [key: string]: any }
        onSettingChange: (settings: any, ...rest: any[]) => void
        useDataSources?: any
        useMapWidgetIds?: any
        intl?: any
        theme?: any
        portalUrl?: string
        [key: string]: any
    }
    export const getAppConfigAction: any
    export const builderAppSync: any
}
