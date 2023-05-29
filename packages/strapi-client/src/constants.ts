import { StrapiClientOptions } from './types';

export const defaultOptions: StrapiClientOptions = {
  url: 'http://127.0.0.1:1337',
  prefix: '/api',
  contentTypes: [],
  jwt: null,
  axiosConfig: {},
};

export const ISO_DATE_REGEX =
  /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/;

export const DATE_PROPERTY_REGEX = /^.+(at|on|date)$/i;
