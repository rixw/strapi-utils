import { StrapiClientOptions } from './types';

/**
 * The default options to use for the StrapiClient.
 */
export const defaultOptions: StrapiClientOptions = {
  url: 'http://127.0.0.1:1337',
  prefix: '/api',
  contentTypes: [],
  jwt: null,
  requestInit: {},
  debug: false,
};

/**
 * The regex used to identify ISO date strings.
 */
export const ISO_DATE_REGEX =
  /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/;

/**
 * The default regex used to identify date properties.
 * (Property names ending in 'at', 'on' or 'date', case insensitive)
 */
export const DATE_PROPERTY_REGEX = /^.+(at|on|date)$/i;
