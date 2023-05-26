import { StrapiClientOptions } from './types';

export const defaultOptions: StrapiClientOptions = {
  url: 'http://127.0.0.1:1337',
  prefix: '/api',
  contentTypes: [],
  jwt: null,
  axiosConfig: {},
};
