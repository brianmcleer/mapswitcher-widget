import { ImmutableObject } from 'seamless-immutable';

export interface SiteConfig {
  label: string;
  url: string;
}

export interface Config {
  sites: SiteConfig[];
}

export type IMConfig = ImmutableObject<Config>;
