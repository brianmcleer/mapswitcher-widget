/** @jsx jsx */
import { React, jsx, AllWidgetProps, getAppStore } from 'jimu-core';
import { JimuMapViewComponent } from 'jimu-arcgis';
import type { JimuMapView } from 'jimu-arcgis';
import { Select, Option } from 'jimu-ui';
import Basemap from 'esri/Basemap';
import Portal from 'esri/portal/Portal';
import * as reactiveUtils from 'esri/core/reactiveUtils';
import { IMConfig, SiteConfig } from '../config';
import { beacon } from '../shared/beacon';
import type { BeaconHandle } from '../shared/beacon';

type WidgetProps = AllWidgetProps<IMConfig> & {
  id: string;
};

const visuallyHiddenStyle: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0
};

// ---------------------------------------------------------------------------
// Basemap hand-off
//
// The source app writes the current basemap into the destination URL query
// string. The destination app's Map Switcher reads it, applies it to its own
// map, then removes the parameters from the address bar so a refresh does not
// re-apply a stale choice.
//
//   ms_basemap=item:<portal item id>   portal item basemap (both galleries)
//   ms_portal=<portal url>             portal that owns the item
//   ms_basemap=wk:<well-known id>      Esri well-known id (topo-vector, etc.)
//   ms_basemap=json:<base64url json>   anything else (OOTB "add by URL")
// ---------------------------------------------------------------------------

// Hand-off channels (shared contract with Basemap Gallery Custom 1.22.0+):
//   URL query    ms_basemap / ms_portal       works across hosts
//   localStorage ms-basemap-carry             same-host fallback if the URL
//                                             query gets dropped on load
//   sessionStorage ms-basemap-handoff and     destination page bus, so the
//   window.__msBasemapHandoff                 gallery can read it after the
//                                             URL params are cleared
const BASEMAP_PARAM = 'ms_basemap';
const PORTAL_PARAM = 'ms_portal';
const CARRY_KEY = 'ms-basemap-carry';
const HANDOFF_KEY = 'ms-basemap-handoff';
const CARRY_MAX_AGE_MS = 120000;
const MAX_JSON_PARAM_LENGTH = 4000;
const GALLERY_GUARD_MS = 30000;
const CUSTOM_GALLERY_NAME = 'basemap-gallery-custom';
const ITEM_ID_PATTERN = /^[a-f0-9]{32}$/i;
const WELL_KNOWN_ID_PATTERN = /^[a-z0-9-]{1,64}$/i;

interface BasemapDescriptor {
  value: string;
  portalUrl?: string;
}

interface BasemapHandoff {
  value: string;
  portalUrl: string | null;
  ts: number;
}

// Read the incoming basemap as soon as the module loads, before the framework
// has a chance to rewrite the address bar.
const readIncomingHandoff = (): BasemapHandoff | null => {
  if (typeof window === 'undefined') return null;
  let value: string | null = null;
  let portalUrl: string | null = null;
  try {
    const params = new URLSearchParams(window.location.search);
    value = params.get(BASEMAP_PARAM);
    portalUrl = params.get(PORTAL_PARAM);
  } catch {
    // ignore
  }
  try {
    if (!value) {
      const raw = window.localStorage.getItem(CARRY_KEY);
      if (raw) {
        const carry = JSON.parse(raw);
        if (carry?.value && Date.now() - Number(carry.ts) < CARRY_MAX_AGE_MS) {
          value = String(carry.value);
          portalUrl = carry.portalUrl ? String(carry.portalUrl) : null;
        }
      }
    }
    window.localStorage.removeItem(CARRY_KEY);
  } catch {
    // storage blocked
  }
  if (!value) return null;
  const handoff: BasemapHandoff = { value, portalUrl, ts: Date.now() };
  (window as any).__msBasemapHandoff = handoff;
  try {
    window.sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(handoff));
  } catch {
    // storage blocked
  }
  return handoff;
};

const incomingHandoff = readIncomingHandoff();

// First Esri Map widget in the app, used when no map is picked in settings.
const findMapWidgetId = (): string | undefined => {
  try {
    const widgets = getAppStore()?.getState()?.appConfig?.widgets || {};
    return Object.keys(widgets).find((key) => {
      const w = widgets[key];
      const name = w?.manifest?.name || '';
      const uri = String(w?.uri || '');
      return name === 'arcgis-map' || uri.includes('arcgis-map');
    });
  } catch {
    return undefined;
  }
};

const toBase64Url = (text: string): string => {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (value: string): string => {
  let b64 = value.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const parentDomain = (host: string): string => {
  const parts = (host || '').toLowerCase().split('.').filter(Boolean);
  return parts.length <= 2 ? parts.join('.') : parts.slice(-2).join('.');
};

const hostFromUrl = (url: string): string => {
  try {
    return new URL(url, window.location.origin).hostname.toLowerCase();
  } catch {
    return '';
  }
};

const getCustomGalleryInfo = (): { defaultIds: string[]; portalUrls: string[] } => {
  const defaultIds: string[] = [];
  const portalUrls: string[] = [];
  try {
    const widgets = getAppStore()?.getState()?.appConfig?.widgets || {};
    Object.keys(widgets).forEach((key) => {
      const w = widgets[key];
      const name = w?.manifest?.name || '';
      const uri = w?.uri || '';
      if (name !== CUSTOM_GALLERY_NAME && !String(uri).includes(CUSTOM_GALLERY_NAME)) return;
      const defaultId = w?.config?.defaultBasemapId;
      if (defaultId) defaultIds.push(String(defaultId));
      const portalUrl = w?.config?.portalUrl;
      if (portalUrl) portalUrls.push(String(portalUrl));
    });
  } catch {
    // App config not readable; no gallery info.
  }
  return { defaultIds, portalUrls };
};

// Hosts a restored basemap may load from: Esri, the app's own domain, the
// app portal's domain, and any portal a custom gallery in this app points at.
const getAllowedDomains = (): string[] => {
  const domains = new Set<string>(['arcgis.com', 'arcgisonline.com']);
  domains.add(parentDomain(window.location.hostname));
  try {
    const appPortal = getAppStore()?.getState()?.portalUrl;
    if (appPortal) domains.add(parentDomain(hostFromUrl(appPortal)));
  } catch {
    // ignore
  }
  getCustomGalleryInfo().portalUrls.forEach((url) => domains.add(parentDomain(hostFromUrl(url))));
  domains.delete('');
  return Array.from(domains);
};

const isAllowedUrl = (url: string, allowed: string[]): boolean => {
  let parsed: URL;
  try {
    parsed = new URL(url, window.location.origin);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
  const host = parsed.hostname.toLowerCase();
  return allowed.some((d) => host === d || host.endsWith(`.${d}`));
};

const collectLayerUrls = (layers: any[], out: string[]) => {
  (layers || []).forEach((layer) => {
    if (layer?.url) out.push(String(layer.url));
    if (layer?.styleUrl) out.push(String(layer.styleUrl));
    if (Array.isArray(layer?.layers)) collectLayerUrls(layer.layers, out);
  });
};

const describeBasemap = (basemap: any): BasemapDescriptor | null => {
  if (!basemap) return null;

  const itemId = basemap.portalItem?.id;
  if (itemId && ITEM_ID_PATTERN.test(itemId)) {
    return { value: `item:${itemId}`, portalUrl: basemap.portalItem?.portal?.url || undefined };
  }

  const basemapId = basemap.id;
  if (basemapId && WELL_KNOWN_ID_PATTERN.test(basemapId)) {
    try {
      if ((Basemap as any).fromId(basemapId)) return { value: `wk:${basemapId}` };
    } catch {
      // not a well-known id
    }
  }

  try {
    const json = basemap.toJSON?.();
    if (json?.baseMapLayers?.length) {
      const encoded = toBase64Url(JSON.stringify(json));
      if (encoded.length <= MAX_JSON_PARAM_LENGTH) return { value: `json:${encoded}` };
    }
  } catch {
    // not serializable
  }

  return null;
};

// Builds the Basemap without waiting for it to load, so it can go on the map
// the moment the view exists and the map's own basemap never paints.
const createBasemap = (value: string, portalUrl: string | null): any => {
  const sep = value.indexOf(':');
  if (sep < 1) return null;
  const kind = value.slice(0, sep);
  const payload = value.slice(sep + 1);
  const allowed = getAllowedDomains();

  if (kind === 'item') {
    if (!ITEM_ID_PATTERN.test(payload)) return null;
    const portalItem: any = { id: payload };
    if (portalUrl) {
      if (!isAllowedUrl(portalUrl, allowed)) return null;
      portalItem.portal = new Portal({ url: portalUrl });
    }
    return new Basemap({ portalItem });
  }

  if (kind === 'wk') {
    if (!WELL_KNOWN_ID_PATTERN.test(payload)) return null;
    return (Basemap as any).fromId(payload) || null;
  }

  if (kind === 'json') {
    const json = JSON.parse(fromBase64Url(payload));
    const urls: string[] = [];
    collectLayerUrls(json?.baseMapLayers, urls);
    collectLayerUrls(json?.referenceLayers, urls);
    if (urls.some((u) => !isAllowedUrl(u, allowed))) return null;
    return (Basemap as any).fromJSON(json);
  }

  return null;
};

const sameBasemap = (a: any, b: any): boolean => {
  if (!a || !b) return false;
  if (a === b) return true;
  const aItem = a.portalItem?.id;
  const bItem = b.portalItem?.id;
  if (aItem || bItem) return aItem === bItem;
  return !!a.id && a.id === b.id;
};

const clearBasemapParams = () => {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(BASEMAP_PARAM) && !url.searchParams.has(PORTAL_PARAM)) return;
    url.searchParams.delete(BASEMAP_PARAM);
    url.searchParams.delete(PORTAL_PARAM);
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  } catch {
    // leave the address bar alone
  }
};

const Widget = (props: WidgetProps) => {
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [announceMessage, setAnnounceMessage] = React.useState('');
  const selectRef = React.useRef<HTMLDivElement>(null);
  const announcerRef = React.useRef<HTMLDivElement>(null);
  const announceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigationTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const widgetIdRef = React.useRef(`map-switcher-${props.id || 'default'}`);
  const beaconRef = React.useRef<BeaconHandle | null>(null);
  const jimuMapViewRef = React.useRef<JimuMapView | null>(null);
  const restoreStartedRef = React.useRef(false);
  const guardCleanupRef = React.useRef<(() => void) | null>(null);

  const rememberBasemap = props.config?.rememberBasemap !== false;
  const mapWidgetId = props.useMapWidgetIds?.[0] || findMapWidgetId();

  React.useEffect(() => { beaconRef.current = beacon.init(props); }, []);

  React.useEffect(() => {
    return () => {
      if (announceTimerRef.current) clearTimeout(announceTimerRef.current);
      if (navigationTimerRef.current) clearTimeout(navigationTimerRef.current);
      guardCleanupRef.current?.();
    };
  }, []);

  const announceToScreenReader = (message: string) => {
    if (announceTimerRef.current) clearTimeout(announceTimerRef.current);

    setAnnounceMessage('');
    announceTimerRef.current = setTimeout(() => {
      setAnnounceMessage(message);
    }, 50);
  };

  // The custom gallery applies its configured default basemap once, after all
  // of its basemaps finish loading. If that lands after the restore, put the
  // carried basemap back one time. The OOTB gallery never overrides the map.
  const guardAgainstGalleryDefault = (view: any, restored: any) => {
    const { defaultIds } = getCustomGalleryInfo();
    if (defaultIds.length === 0) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const handle = reactiveUtils.watch(
      () => view.map?.basemap,
      (next: any) => {
        const nextId = next?.portalItem?.id;
        if (!next || !nextId || !defaultIds.includes(nextId) || sameBasemap(next, restored)) return;
        cleanup();
        if (!view.destroyed && view.map) view.map.basemap = restored;
      }
    );
    const cleanup = () => {
      if (timer) clearTimeout(timer);
      timer = null;
      handle?.remove();
      guardCleanupRef.current = null;
    };
    timer = setTimeout(cleanup, GALLERY_GUARD_MS);
    guardCleanupRef.current = cleanup;
  };

  const restoreBasemap = async (view: any) => {
    clearBasemapParams();
    if (!incomingHandoff || !rememberBasemap) return;
    const { value, portalUrl } = incomingHandoff;

    try {
      const restored = createBasemap(value, portalUrl);
      if (!restored) return;
      // Start fetching right away; it runs in parallel with the map load.
      const loading = restored.load();
      if (!view.map) await view.when();
      if (view.destroyed || !view.map) return;

      const current = view.map.basemap;
      // If the custom gallery default is already on the map, the gallery has
      // finished its one-time default and no guard is needed.
      const { defaultIds } = getCustomGalleryInfo();
      const galleryAlreadyApplied = !!current?.portalItem?.id && defaultIds.includes(current.portalItem.id);

      if (!sameBasemap(current, restored)) view.map.basemap = restored;
      if (!galleryAlreadyApplied) guardAgainstGalleryDefault(view, restored);

      loading.then(() => {
        beaconRef.current?.action('basemap-restore');
      }).catch((e: any) => {
        // Carried basemap failed to load: put the app's own basemap back.
        if (!view.destroyed && view.map?.basemap === restored && current) view.map.basemap = current;
        beaconRef.current?.error(e, 'basemap-restore');
      });
    } catch (e) {
      beaconRef.current?.error(e, 'basemap-restore');
    }
  };

  const onActiveViewChange = (jimuMapView: JimuMapView) => {
    jimuMapViewRef.current = jimuMapView || null;
    if (jimuMapView?.view && !restoreStartedRef.current) {
      restoreStartedRef.current = true;
      void restoreBasemap(jimuMapView.view);
    }
  };

  const handleSiteChange = (event: any) => {
    const siteUrl = event.target?.value || event;
    if (!siteUrl) return;

    const sites = props.config?.sites || [];
    const selectedSite = sites.find((site: SiteConfig) => site.url === siteUrl);
    if (!selectedSite?.url) return;

    let destinationUrl: URL;
    try {
      destinationUrl = new URL(selectedSite.url, window.location.origin);
    } catch (e) {
      beaconRef.current?.error(e, 'switch');
      return;
    }

    if (destinationUrl.protocol !== 'http:' && destinationUrl.protocol !== 'https:') {
      return;
    }

    const siteName = selectedSite.label || 'selected map';
    beaconRef.current?.action('switch');
    setIsNavigating(true);
    announceToScreenReader(`Navigating to ${siteName}. Please wait.`);

    destinationUrl.searchParams.delete(BASEMAP_PARAM);
    destinationUrl.searchParams.delete(PORTAL_PARAM);
    if (rememberBasemap) {
      try {
        const currentBasemap = jimuMapViewRef.current?.view?.map?.basemap;
        const descriptor = describeBasemap(currentBasemap);
        if (descriptor) {
          destinationUrl.searchParams.set(BASEMAP_PARAM, descriptor.value);
          if (descriptor.portalUrl) destinationUrl.searchParams.set(PORTAL_PARAM, descriptor.portalUrl);
          try {
            window.localStorage.setItem(CARRY_KEY, JSON.stringify({
              value: descriptor.value,
              portalUrl: descriptor.portalUrl || null,
              ts: Date.now()
            }));
          } catch {
            // storage blocked; the URL still carries it
          }
        }
      } catch (e) {
        beaconRef.current?.error(e, 'basemap-carry');
      }
    }

    destinationUrl.hash = window.location.hash || '';

    navigationTimerRef.current = setTimeout(() => {
      window.location.href = destinationUrl.toString();
    }, 100);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && selectRef.current) {
      (selectRef.current as any).blur?.();
      announceToScreenReader('Selection cancelled');
    }
  };

  const handleFocus = () => {
    const siteCount = props.config?.sites?.length || 0;
    announceToScreenReader(
      `Map switcher. ${siteCount} map${siteCount !== 1 ? 's' : ''} available. Use arrow keys to browse options.`
    );
  };

  const sites = props.config?.sites || [];
  const widgetId = widgetIdRef.current;
  const selectId = `${widgetId}-select`;
  const labelId = `${widgetId}-label`;
  const descriptionId = `${widgetId}-description`;
  const statusId = `${widgetId}-status`;

  const mapViewComponent = mapWidgetId
    ? (
      <JimuMapViewComponent
        useMapWidgetId={mapWidgetId}
        onActiveViewChange={onActiveViewChange}
      />
      )
    : null;

  if (sites.length === 0) {
    return (
      <div
        className="widget-map-switcher"
        style={{ padding: '10px' }}
        role="region"
        aria-label="Map Switcher"
      >
        <p role="status" aria-live="polite">
          No sites configured. Please configure map sites in the widget settings.
        </p>
        {mapViewComponent}
      </div>
    );
  }

  return (
    <div
      className="widget-map-switcher jimu-widget"
      style={{ padding: '5px', width: '100%' }}
      role="region"
      aria-labelledby={labelId}
      aria-describedby={descriptionId}
    >
      <label id={labelId} htmlFor={selectId} style={visuallyHiddenStyle}>
        Map Switcher - Select a map to navigate to
      </label>

      <span id={descriptionId} style={visuallyHiddenStyle}>
        {`Choose from ${sites.length} available map${sites.length !== 1 ? 's' : ''}. Selecting a map will navigate you to that location${rememberBasemap && mapWidgetId ? ' and keep the current basemap' : ''}.`}
      </span>

      <div onKeyDown={handleKeyDown} onFocus={handleFocus} role="presentation">
        <Select
          id={selectId}
          ref={selectRef as any}
          value=""
          onChange={handleSiteChange}
          placeholder="Select map to view"
          size="sm"
          style={{ width: '100%' }}
          aria-labelledby={labelId}
          aria-describedby={`${descriptionId} ${statusId}`}
          aria-busy={isNavigating}
          disabled={isNavigating}
          title="Select a map to navigate to a different view"
        >
          {sites.map((site: SiteConfig, index: number) => (
            <Option
              key={site.url || index}
              value={site.url}
              aria-label={`Navigate to ${site.label}`}
              title={`Navigate to ${site.label}`}
            >
              {site.label}
            </Option>
          ))}
        </Select>
      </div>

      {isNavigating && (
        <div
          id={statusId}
          role="status"
          aria-live="assertive"
          aria-atomic="true"
          style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}
        >
          <span aria-hidden="true">Loading...</span>
          <span style={visuallyHiddenStyle}>
            Navigating to selected map. Please wait.
          </span>
        </div>
      )}

      <div
        ref={announcerRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={visuallyHiddenStyle}
      >
        {announceMessage}
      </div>

      <a
        href="#main-content"
        style={visuallyHiddenStyle}
        onFocus={(event) => {
          const target = event.target as HTMLElement;
          target.style.position = 'static';
          target.style.width = 'auto';
          target.style.height = 'auto';
          target.style.margin = '0';
          target.style.clip = 'auto';
          target.style.overflow = 'visible';
        }}
        onBlur={(event) => {
          const target = event.target as HTMLElement;
          target.style.position = 'absolute';
          target.style.width = '1px';
          target.style.height = '1px';
          target.style.margin = '-1px';
          target.style.clip = 'rect(0, 0, 0, 0)';
          target.style.overflow = 'hidden';
        }}
      >
        Skip to main content
      </a>

      {mapViewComponent}
    </div>
  );
};

export default Widget;
