import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import fixture from '../normalise/normalise.fixture.json';
import { FixtureData } from '../normalise/normalise.spec';
import { StrapiPaginationOffsetResponse, StrapiPaginationPageResponse } from './../types';
import { StrapiClient } from './client';

let mock = new MockAdapter(axios);

describe('StrapiClient', () => {
  beforeEach(async () => {
    mock.reset();
  });

  it('should instantiate with default options', async () => {
    const client = new StrapiClient();
    expect(client).toBeInstanceOf(StrapiClient);
    expect(client.opts.url).toBe(`http://127.0.0.1:1337`);
    expect(client.opts.prefix).toBe('/api');
    expect(client.opts.jwt).toBeNull();
    expect(client.opts.axiosConfig).toBeDefined();
    expect(client.opts.contentTypes).toHaveLength(0);
    expect(client.entityMap).toBeDefined();
    expect(client.entityMap.size).toBe(0);
  });

  it('should instantiate with provided options', async () => {
    const client = new StrapiClient({
      url: 'http://127.0.0.1:9999',
      prefix: '/api',
      contentTypes: ['page'],
      jwt: '1234567890',
      axiosConfig: {
        timeout: 999,
      },
    });
    expect(client).toBeInstanceOf(StrapiClient);
    expect(client.opts.url).toBe('http://127.0.0.1:9999');
    expect(client.opts.jwt).toBe('1234567890');
    expect(client.opts.axiosConfig).toBeDefined();
    expect(client.opts.axiosConfig?.timeout).toBe(999);
    expect(client.entityMap.size).toBe(1);
    expect(client.entityMap.get('page')).toBeDefined();
    expect(client.entityMap.get('page')?.id).toBe('api::page.page');
    expect(client.entityMap.get('page')?.pluralName).toBe('pages');
    expect(client.entityMap.get('page')?.singularName).toBe('page');
  });

  it('should get an endpoint in the format /prefix/pluralName', async () => {
    const client = new StrapiClient({
      contentTypes: ['page'],
    });
    const endpoint = client.getEndpoint('page');
    expect(endpoint).toBe(`http://127.0.0.1:1337/api/pages`);
  });

  it('should return a normalised result with pagination', async () => {
    const url = `http://127.0.0.1:1337/api/pages`;
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
    const url = `http://127.0.0.1:1337/api/pages/1`;
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
    const url = `http://127.0.0.1:1337/api/pages`;
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

  it('should create a new item and return the normalised single item result', async () => {
    const url = `http://127.0.0.1:1337/api/pages`;
    mock.onPost(url).reply(201, {
      data: fixture.data[0],
      meta: {},
    });
    const client = new StrapiClient({
      contentTypes: ['page'],
    });
    const result = await client.create<FixtureData>('page', fixture.data[0].attributes);
    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.title).toBe('Root');
  });

  it('should update an item and return the normalised single item result', async () => {
    const url = `http://127.0.0.1:1337/api/pages/1`;
    mock.onPut(url).reply(200, {
      data: fixture.data[0],
      meta: {},
    });
    const client = new StrapiClient({
      contentTypes: ['page'],
    });
    const result = await client.update<FixtureData>('page', 1, fixture.data[0].attributes);
    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.title).toBe('Root');
  });

  it('should delete an item and return the normalised single item result', async () => {
    const url = `http://127.0.0.1:1337/api/pages/2`;
    mock.onDelete(url).reply(200, {
      data: fixture.data[1],
      meta: {},
    });
    const client = new StrapiClient({
      contentTypes: ['page'],
    });
    const result = await client.delete<FixtureData>('page', 2);
    expect(result).toBeDefined();
    expect(result.id).toBe(2);
    expect(result.title).toBe('Node');
  });

  it('should fetch all items and return a simple array', async () => {
    mock
      .onGet()
      .replyOnce(200, {
        data: [fixture.data[0]],
        meta: { pagination: { start: 0, limit: 1, total: 3 } as StrapiPaginationOffsetResponse },
      })
      .onGet()
      .replyOnce(200, {
        data: [fixture.data[1]],
        meta: { pagination: { start: 1, limit: 1, total: 3 } as StrapiPaginationOffsetResponse },
      })
      .onGet()
      .replyOnce(200, {
        data: [fixture.data[2]],
        meta: { pagination: { start: 2, limit: 1, total: 3 } as StrapiPaginationOffsetResponse },
      });
    const client = new StrapiClient({
      contentTypes: ['page'],
    });
    const result = await client.fetchAll<FixtureData>('page', undefined, 1);
    expect(result).toBeDefined();
    expect(result.length).toBe(3);
    expect(result[0].id).toBe(1);
    expect(result[0].title).toBe('Root');
    expect(result[1].id).toBe(2);
    expect(result[1].title).toBe('Node');
    expect(result[2].id).toBe(3);
    expect(result[2].title).toBe('Leaf');
  });

  it('should throw if fetching all items takes longer than the timeout', async () => {
    const slowMock = new MockAdapter(axios, { delayResponse: 500 });
    slowMock
      .onGet()
      .replyOnce(200, {
        data: [fixture.data[0]],
        meta: { pagination: { start: 0, limit: 1, total: 3 } as StrapiPaginationOffsetResponse },
      })
      .onGet()
      .replyOnce(200, {
        data: [fixture.data[1]],
        meta: { pagination: { start: 1, limit: 1, total: 3 } as StrapiPaginationOffsetResponse },
      })
      .onGet()
      .replyOnce(200, {
        data: [fixture.data[2]],
        meta: { pagination: { start: 2, limit: 1, total: 3 } as StrapiPaginationOffsetResponse },
      });
    const client = new StrapiClient({
      contentTypes: ['page'],
    });
    try {
      await client.fetchAll<FixtureData>('page', undefined, 1, 750);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty('message');
    }
  });
});
