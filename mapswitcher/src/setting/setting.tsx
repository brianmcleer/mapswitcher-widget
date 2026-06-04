/** @jsx jsx */
import { React, jsx, Immutable } from 'jimu-core';
import { AllWidgetSettingProps } from 'jimu-for-builder';
import { TextInput, Button, Label, Icon } from 'jimu-ui';
import { SettingSection } from 'jimu-ui/advanced/setting-components';
import { IMConfig, SiteConfig } from '../config';

export default class Setting extends React.PureComponent<AllWidgetSettingProps<IMConfig>> {
    onSiteLabelChange = (index: number, value: string) => {
        const { config } = this.props;
        const sites = config?.sites ? [...config.sites] : [];
        sites[index] = { ...sites[index], label: value };

        this.props.onSettingChange({
            id: this.props.id,
            config: config.set('sites', sites)
        });
    };

    onSiteUrlChange = (index: number, value: string) => {
        const { config } = this.props;
        const sites = config?.sites ? [...config.sites] : [];
        sites[index] = { ...sites[index], url: value };

        this.props.onSettingChange({
            id: this.props.id,
            config: config.set('sites', sites)
        });
    };

    addSite = () => {
        const { config } = this.props;
        const sites = config?.sites ? [...config.sites] : [];
        sites.push({ label: '', url: '' });

        this.props.onSettingChange({
            id: this.props.id,
            config: config.set('sites', sites)
        });
    };

    removeSite = (index: number) => {
        const { config } = this.props;
        const sites = config?.sites ? [...config.sites] : [];
        sites.splice(index, 1);

        this.props.onSettingChange({
            id: this.props.id,
            config: config.set('sites', sites)
        });
    };

    moveSiteUp = (index: number) => {
        if (index === 0) return;
        const { config } = this.props;
        const sites = config?.sites ? [...config.sites] : [];
        const temp = sites[index - 1];
        sites[index - 1] = sites[index];
        sites[index] = temp;

        this.props.onSettingChange({
            id: this.props.id,
            config: config.set('sites', sites)
        });
    };

    moveSiteDown = (index: number) => {
        const { config } = this.props;
        const sites = config?.sites ? [...config.sites] : [];
        if (index >= sites.length - 1) return;
        const temp = sites[index + 1];
        sites[index + 1] = sites[index];
        sites[index] = temp;

        this.props.onSettingChange({
            id: this.props.id,
            config: config.set('sites', sites)
        });
    };

    render() {
        const { config } = this.props;
        const sites = config?.sites || [];

        return (
            <div className="widget-setting-map-switcher" style={{ padding: '20px' }}>
                <SettingSection title="Sites">
                    {sites.map((site: SiteConfig, index: number) => (
                        <div key={index} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#666' }}>Site {index + 1}</span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <Button
                                        size="sm"
                                        type="tertiary"
                                        onClick={() => this.moveSiteUp(index)}
                                        disabled={index === 0}
                                        title="Move up"
                                        aria-label={`Move site ${index + 1} up`}
                                        style={{ padding: '2px 6px', minWidth: 'auto' }}
                                    >
                                        ▲
                                    </Button>
                                    <Button
                                        size="sm"
                                        type="tertiary"
                                        onClick={() => this.moveSiteDown(index)}
                                        disabled={index === sites.length - 1}
                                        title="Move down"
                                        aria-label={`Move site ${index + 1} down`}
                                        style={{ padding: '2px 6px', minWidth: 'auto' }}
                                    >
                                        ▼
                                    </Button>
                                </div>
                            </div>

                            <Label style={{ marginBottom: '5px' }}>Label</Label>
                            <TextInput
                                value={site.label}
                                onChange={(e) => this.onSiteLabelChange(index, e.target.value)}
                                placeholder="Site name"
                                style={{ marginBottom: '10px' }}
                            />

                            <Label style={{ marginBottom: '5px' }}>URL</Label>
                            <TextInput
                                value={site.url}
                                onChange={(e) => this.onSiteUrlChange(index, e.target.value)}
                                placeholder="https://..."
                                style={{ marginBottom: '10px' }}
                            />

                            <Button
                                size="sm"
                                type="danger"
                                onClick={() => this.removeSite(index)}
                            >
                                Remove
                            </Button>
                        </div>
                    ))}

                    <Button
                        onClick={this.addSite}
                        style={{ marginTop: '10px' }}
                    >
                        Add Site
                    </Button>
                </SettingSection>
            </div>
        );
    }
}