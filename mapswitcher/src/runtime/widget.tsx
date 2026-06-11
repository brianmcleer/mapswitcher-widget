/** @jsx jsx */
import { React, jsx, AllWidgetProps } from 'jimu-core';
import { Select, Option } from 'jimu-ui';
import { IMConfig, SiteConfig } from '../config';

interface State {
    isNavigating: boolean;
    announceMessage: string;
}

export default class Widget extends React.PureComponent<AllWidgetProps<IMConfig>, State> {
    private selectRef: React.RefObject<HTMLDivElement>;
    private announcerRef: React.RefObject<HTMLDivElement>;
    private widgetId: string;

    constructor(props: AllWidgetProps<IMConfig>) {
        super(props);
        this.selectRef = React.createRef();
        this.announcerRef = React.createRef();
        this.widgetId = `map-switcher-${props.id || 'default'}`;
        this.state = {
            isNavigating: false,
            announceMessage: ''
        };
    }

    /**
     * Announces a message to screen readers via live region
     */
    announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
        this.setState({ announceMessage: '' }, () => {
            setTimeout(() => {
                this.setState({ announceMessage: message });
            }, 50);
        });
    };

    handleSiteChange = (evt: any) => {
        const siteUrl = evt.target?.value || evt;
        if (!siteUrl) return;

        const { config } = this.props;
        const sites = config?.sites || [];
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

        // Update state to show loading/navigating status
        this.setState({ isNavigating: true });

        // Announce navigation to screen readers
        this.announceToScreenReader(`Navigating to ${siteName}. Please wait.`, 'assertive');

        destinationUrl.hash = window.location.hash || '';

        // Small delay to allow screen reader announcement
        setTimeout(() => {
            window.location.href = destinationUrl.toString();
        }, 100);
    };

    handleKeyDown = (evt: React.KeyboardEvent<HTMLDivElement>) => {
        // Provide additional keyboard support
        if (evt.key === 'Escape') {
            // Reset selection on Escape
            if (this.selectRef.current) {
                (this.selectRef.current as any).blur?.();
                this.announceToScreenReader('Selection cancelled');
            }
        }
    };

    handleFocus = () => {
        const { config } = this.props;
        const sites = config?.sites || [];
        const siteCount = sites.length;

        // Announce available options count when focused
        this.announceToScreenReader(
            `Map switcher. ${siteCount} map${siteCount !== 1 ? 's' : ''} available. Use arrow keys to browse options.`
        );
    };

    render() {
        const { config } = this.props;
        const { isNavigating, announceMessage } = this.state;
        const sites = config?.sites || [];
        const selectId = `${this.widgetId}-select`;
        const labelId = `${this.widgetId}-label`;
        const descriptionId = `${this.widgetId}-description`;
        const statusId = `${this.widgetId}-status`;

        if (sites.length === 0) {
            return (
                <div
                    className="widget-map-switcher"
                    style={{ padding: '10px' }}
                    role="region"
                    aria-label="Map Switcher"
                >
                    <p
                        role="status"
                        aria-live="polite"
                    >
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
                {/* Visually hidden label for screen readers */}
                <label
                    id={labelId}
                    htmlFor={selectId}
                    style={{
                        position: 'absolute',
                        width: '1px',
                        height: '1px',
                        padding: 0,
                        margin: '-1px',
                        overflow: 'hidden',
                        clip: 'rect(0, 0, 0, 0)',
                        whiteSpace: 'nowrap',
                        border: 0
                    }}
                >
                    Map Switcher - Select a map to navigate to
                </label>

                {/* Hidden description for additional context */}
                <span
                    id={descriptionId}
                    style={{
                        position: 'absolute',
                        width: '1px',
                        height: '1px',
                        padding: 0,
                        margin: '-1px',
                        overflow: 'hidden',
                        clip: 'rect(0, 0, 0, 0)',
                        whiteSpace: 'nowrap',
                        border: 0
                    }}
                >
                    {`Choose from ${sites.length} available map${sites.length !== 1 ? 's' : ''}. Selecting a map will navigate you to that location.`}
                </span>

                {/* Wrapper for keyboard and focus event handling */}
                <div
                    onKeyDown={this.handleKeyDown}
                    onFocus={this.handleFocus}
                    role="presentation"
                >
                    <Select
                        id={selectId}
                        ref={this.selectRef as any}
                        value=""
                        onChange={this.handleSiteChange}
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

                {/* Loading status indicator */}
                {isNavigating && (
                    <div
                        id={statusId}
                        role="status"
                        aria-live="assertive"
                        aria-atomic="true"
                        style={{
                            marginTop: '5px',
                            fontSize: '12px',
                            color: '#666'
                        }}
                    >
                        <span aria-hidden="true">Loading...</span>
                        <span
                            style={{
                                position: 'absolute',
                                width: '1px',
                                height: '1px',
                                padding: 0,
                                margin: '-1px',
                                overflow: 'hidden',
                                clip: 'rect(0, 0, 0, 0)',
                                whiteSpace: 'nowrap',
                                border: 0
                            }}
                        >
                            Navigating to selected map. Please wait.
                        </span>
                    </div>
                )}

                {/* Live region for screen reader announcements */}
                <div
                    ref={this.announcerRef}
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                    style={{
                        position: 'absolute',
                        width: '1px',
                        height: '1px',
                        padding: 0,
                        margin: '-1px',
                        overflow: 'hidden',
                        clip: 'rect(0, 0, 0, 0)',
                        whiteSpace: 'nowrap',
                        border: 0
                    }}
                >
                    {announceMessage}
                </div>

                {/* Skip link for keyboard navigation (useful if widget is in a complex layout) */}
                <a
                    href="#main-content"
                    style={{
                        position: 'absolute',
                        width: '1px',
                        height: '1px',
                        padding: 0,
                        margin: '-1px',
                        overflow: 'hidden',
                        clip: 'rect(0, 0, 0, 0)',
                        whiteSpace: 'nowrap',
                        border: 0
                    }}
                    onFocus={(e) => {
                        // Make visible on focus
                        const target = e.target as HTMLElement;
                        target.style.position = 'static';
                        target.style.width = 'auto';
                        target.style.height = 'auto';
                        target.style.margin = '0';
                        target.style.clip = 'auto';
                        target.style.overflow = 'visible';
                    }}
                    onBlur={(e) => {
                        // Hide again on blur
                        const target = e.target as HTMLElement;
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
    }
}