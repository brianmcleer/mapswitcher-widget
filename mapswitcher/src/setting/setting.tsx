/** @jsx jsx */
import { React, jsx } from 'jimu-core';
import { AllWidgetSettingProps } from 'jimu-for-builder';
import { TextInput, Button, Label, Switch } from 'jimu-ui';
import { SettingSection, SettingRow, MapWidgetSelector } from 'jimu-ui/advanced/setting-components';
import { IMConfig, SiteConfig } from '../config';

type SettingProps = AllWidgetSettingProps<IMConfig> & {
  id: string;
};

const Setting = (props: SettingProps) => {
  const getSites = (): SiteConfig[] => (
    props.config?.sites ? [...props.config.sites] : []
  );

  const saveSites = (sites: SiteConfig[]) => {
    props.onSettingChange({
      id: props.id,
      config: props.config.set('sites', sites)
    });
  };

  const onSiteLabelChange = (index: number, value: string) => {
    const sites = getSites();
    sites[index] = { ...sites[index], label: value };
    saveSites(sites);
  };

  const onSiteUrlChange = (index: number, value: string) => {
    const sites = getSites();
    sites[index] = { ...sites[index], url: value };
    saveSites(sites);
  };

  const addSite = () => {
    const sites = getSites();
    sites.push({ label: '', url: '' });
    saveSites(sites);
  };

  const removeSite = (index: number) => {
    const sites = getSites();
    sites.splice(index, 1);
    saveSites(sites);
  };

  const moveSiteUp = (index: number) => {
    if (index === 0) return;

    const sites = getSites();
    [sites[index - 1], sites[index]] = [sites[index], sites[index - 1]];
    saveSites(sites);
  };

  const moveSiteDown = (index: number) => {
    const sites = getSites();
    if (index >= sites.length - 1) return;

    [sites[index], sites[index + 1]] = [sites[index + 1], sites[index]];
    saveSites(sites);
  };

  const onMapWidgetSelected = (useMapWidgetIds: string[]) => {
    props.onSettingChange({
      id: props.id,
      useMapWidgetIds
    });
  };

  const onRememberBasemapChange = (event: any, checked?: boolean) => {
    const value = typeof checked === 'boolean' ? checked : !!event?.target?.checked;
    props.onSettingChange({
      id: props.id,
      config: props.config.set('rememberBasemap', value)
    });
  };

  const sites = props.config?.sites || [];
  const rememberBasemap = props.config?.rememberBasemap !== false;
  const hasMap = !!props.useMapWidgetIds?.[0];

  return (
    <div className="widget-setting-map-switcher" style={{ padding: '20px' }}>
      <SettingSection title="Basemap">
        <SettingRow flow="wrap" label="Map widget">
          <MapWidgetSelector
            useMapWidgetIds={props.useMapWidgetIds}
            onSelect={onMapWidgetSelected}
          />
        </SettingRow>

        <SettingRow label="Carry basemap to next map">
          <Switch
            checked={rememberBasemap}
            onChange={onRememberBasemapChange}
            aria-label="Carry basemap to next map"
          />
        </SettingRow>

        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px', marginBottom: 0 }}>
          {hasMap
            ? 'Sends the basemap chosen in either basemap gallery to the next app. The destination app needs a Map Switcher connected to its map to apply it.'
            : 'No map selected: the first Map widget in the app is used. Select one here if the app has more than one map.'}
        </p>
      </SettingSection>

      <SettingSection title="Sites">
        {sites.map((site: SiteConfig, index: number) => (
          <div
            key={index}
            style={{
              marginBottom: '15px',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px'
              }}
            >
              <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#666' }}>
                Site {index + 1}
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <Button
                  size="sm"
                  type="tertiary"
                  onClick={() => moveSiteUp(index)}
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
                  onClick={() => moveSiteDown(index)}
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
              onChange={(event) => onSiteLabelChange(index, event.target.value)}
              placeholder="Site name"
              style={{ marginBottom: '10px' }}
            />

            <Label style={{ marginBottom: '5px' }}>URL</Label>
            <TextInput
              value={site.url}
              onChange={(event) => onSiteUrlChange(index, event.target.value)}
              placeholder="https://..."
              style={{ marginBottom: '10px' }}
            />

            <Button size="sm" type="danger" onClick={() => removeSite(index)}>
              Remove
            </Button>
          </div>
        ))}

        <Button onClick={addSite} style={{ marginTop: '10px' }}>
          Add Site
        </Button>
      </SettingSection>
    </div>
  );
};

export default Setting;
