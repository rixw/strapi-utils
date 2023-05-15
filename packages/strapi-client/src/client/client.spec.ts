import { StrapiPaginationPageResponse } from './../interfaces';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import fixture from '../normalise/normalise.fixture.json';
import { FixtureData } from '../normalise/normalise.spec';
import { StrapiClient, defaultOptions } from './client';

const mock = new MockAdapter(axios);
const domain = (defaultOptions.baseUrl as string).replace('/api', '');

describe('StrapiClient', () => {
  beforeEach(async () => {});

  it('should instantiate with default options', async () => {
    const client = new StrapiClient();
    expect(client).toBeInstanceOf(StrapiClient);
    expect(client.opts.baseUrl).toBe(`${domain}/api`);
    expect(client.opts.jwt).toBeNull();
    expect(client.opts.axiosConfig).toBeDefined();
    expect(client.opts.contentTypes).toHaveLength(0);
    expect(client.entityMap).toBeDefined();
    expect(client.entityMap.size).toBe(0);
  });

  it('should instantiate with provided options', async () => {
    const client = new StrapiClient({
      baseUrl: 'http://127.0.0.1:9999/api',
      contentTypes: ['page'],
      jwt: '1234567890',
      axiosConfig: {
        timeout: 999,
      },
    });
    expect(client).toBeInstanceOf(StrapiClient);
    expect(client.opts.baseUrl).toBe('http://127.0.0.1:9999/api');
    expect(client.opts.jwt).toBe('1234567890');
    expect(client.opts.axiosConfig).toBeDefined();
    expect(client.opts.axiosConfig?.timeout).toBe(999);
    expect(client.entityMap.size).toBe(1);
    expect(client.entityMap.get('page')).toBeDefined();
    expect(client.entityMap.get('page')?.id).toBe('api::page.page');
    expect(client.entityMap.get('page')?.pluralName).toBe('pages');
    expect(client.entityMap.get('page')?.singularName).toBe('page');
  });

  it('should get an endpoint in the format /api/pluralName', async () => {
    const client = new StrapiClient({
      contentTypes: ['page'],
    });
    const endpoint = client.getEndpoint('page');
    expect(endpoint).toBe(`${domain}/api/pages`);
  });

  it('should return a normalised result with pagination', async () => {
    const url = `${domain}/api/pages`;
    mock.onGet(url).reply(200, fixture);
    const client = new StrapiClient({
      contentTypes: ['page'],
    });
    const result = await client.fetchMany<FixtureData>('page');
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe(1);
    expect(result[0].title).toBe('Root');
    expect(result[1].id).toBe(2);
    expect(result[1].title).toBe('Node');
    expect(result[2].id).toBe(3);
    expect(result[2].title).toBe('Leaf');
    const pagination = result.pagination as StrapiPaginationPageResponse;
    expect(pagination).toBeDefined();
    expect(pagination.page).toBe(1);
    expect(pagination.pageSize).toBe(25);
  });

  it('should return a normalised single item result', async () => {
    const url = `${domain}/api/pages/1`;
    mock.onGet(url).reply(200, {
      data: fixture.data[0],
      meta: {},
    });
    const client = new StrapiClient({
      contentTypes: ['page'],
    });
    const result = await client.fetchById<FixtureData>('page', 1);
    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.title).toBe('Root');
  });

  it('should respect provided axios config', async () => {
    const url = `${domain}/api/pages`;
    mock.onGet(url).reply((config) => {
      expect(config.timeout).toBe(12345);
      return [200, fixture];
    });
    const client = new StrapiClient({
      contentTypes: ['page'],
      axiosConfig: {
        timeout: 12345,
      },
    });
    const result = await client.fetchMany<FixtureData>('page');
    expect(result).toHaveLength(3);
  });
});
