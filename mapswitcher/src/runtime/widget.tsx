/** @jsx jsx */
import { React, jsx, AllWidgetProps } from 'jimu-core';
import { Select, Option } from 'jimu-ui';
import { IMConfig, SiteConfig } from '../config';

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

const Widget = (props: WidgetProps) => {
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [announceMessage, setAnnounceMessage] = React.useState('');
  const selectRef = React.useRef<HTMLDivElement>(null);
  const announcerRef = React.useRef<HTMLDivElement>(null);
  const announceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigationTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const widgetIdRef = React.useRef(`map-switcher-${props.id || 'default'}`);

  React.useEffect(() => {
    return () => {
      if (announceTimerRef.current) clearTimeout(announceTimerRef.current);
      if (navigationTimerRef.current) clearTimeout(navigationTimerRef.current);
    };
  }, []);

  const announceToScreenReader = (message: string) => {
    if (announceTimerRef.current) clearTimeout(announceTimerRef.current);

    setAnnounceMessage('');
    announceTimerRef.current = setTimeout(() => {
      setAnnounceMessage(message);
    }, 50);
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
    } catch {
      return;
    }

    if (destinationUrl.protocol !== 'http:' && destinationUrl.protocol !== 'https:') {
      return;
    }

    const siteName = selectedSite.label || 'selected map';
    setIsNavigating(true);
    announceToScreenReader(`Navigating to ${siteName}. Please wait.`);

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
        {`Choose from ${sites.length} available map${sites.length !== 1 ? 's' : ''}. Selecting a map will navigate you to that location.`}
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
    </div>
  );
};

export default Widget;
