import { ImmutableObject } from 'jimu-core';

export interface SiteConfig {
    label: string;
    url: string;
}

export interface Config {
    sites: SiteConfig[];
    /** Carry the current basemap to the destination app. Default true. */
    rememberBasemap?: boolean;
}

export type IMConfig = ImmutableObject<Config>;
