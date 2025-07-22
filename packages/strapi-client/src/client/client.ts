import pluralize from 'pluralize';
import qs from 'qs';
import { defaultOptions } from '../constants';
import { normaliseStrapiResponseArray, normaliseStrapiResponseItem } from '../normalise';
import {
  ID,
  StrapiAuthenticationResponse,
  StrapiClientOptions,
  StrapiContentType,
  StrapiContentTypeInput,
  StrapiEntity,
  StrapiPaginatedArray,
  StrapiParams,
  StrapiResponse,
  StrapiUser,
} from '../types';

const getSimpleEntitySpec = (contentType: string): StrapiContentType => {
  return {
    id: `api::${contentType}.${contentType}`,
    singularName: contentType,
    path: `/api/${pluralize(contentType)}`,
  };
};

const getEntitySpec = (contentType: string | StrapiContentTypeInput): StrapiContentType => {
  const isSimple = typeof contentType === 'string';
  return isSimple ? getSimpleEntitySpec(contentType as string) : contentType;
};

const loggableObject = (obj: any) => {
  if (obj === undefined) return undefined;
  if (obj === null) return null;
  try {
    const result = structuredClone(obj);
    return result;
  } catch (e) {}
  return undefined;
};

export class StrapiClient {
  opts: StrapiClientOptions;
  readonly entityMap: Map<string, StrapiContentType>;
  user?: StrapiUser;
  requestInit: RequestInit;

  /**
   * StrapiClient constructor
   * @constructor
   * @param options - Constuctor options for your StrapiClient instance
   * @param options.url - The URL of your Strapi instance, defaults to http://localhost:1337
   * @param options.prefix - The prefix for your Strapi instance, defaults to /api
   * @param options.jwt - The JWT token to use for authentication if using long-lived AuthTokens
   * @param options.requestInit - Fetch API configuration options, passed directly to fetch
   * @param options.contentTypes - The content types you want to use with your Strapi instance
   * @param options.maxRequestsPerSecond - The maximum number of requests per second
   * @param options.debug - Whether to log debug information to the console
   */
  constructor(private readonly options?: StrapiClientOptions) {
    options?.debug && console.debug('StrapiClient:constructor', loggableObject(options));
    this.opts = { ...defaultOptions, ...options };
    this.entityMap = new Map();
    this.opts?.contentTypes?.forEach((contentType) => {
      const spec = getEntitySpec(contentType);
      this.entityMap.set(spec.singularName, spec);
    });
    this.requestInit = this.opts.requestInit ?? {};
  }

  private getUrl(path: string): string {
    return `${this.opts.url}${path}`;
  }

  /**
   * Gets the endpoint URL for the given entity name, ID and params
   * @param entityName - The singular name of the entity you want to query/write
   * @param id - The ID of the entity you want to query/write, or undefined
   * @param params - The params to pass to the Strapi API
   * @returns The endpoint URL
   */
  public getEndpoint(entityName: string, id?: ID, params?: StrapiParams): string {
    this.opts.debug &&
      console.debug('StrapiClient:getEndpoint', entityName, id, loggableObject(params));
    const contentType = this.entityMap.get(entityName);
    if (!contentType) {
      throw new Error(`Entity ${entityName} not found`);
    }
    const query = qs.stringify(params, { addQueryPrefix: true, encodeValuesOnly: true });
    return this.getUrl(`${contentType.path}${id ? `/${id}` : ''}${query}`);
  }

  /**
   * Performs login using the Strapi Users & Permissions plugin
   * @param identifier - The username or email address of the user
   * @param password - The password of the user
   * @returns A JWT token
   */
  public async login(identifier: string, password: string): Promise<string> {
    this.opts.debug && console.debug('StrapiClient:login', identifier);
    try {
      const response = await fetch(this.getUrl('/auth/local'), {
        ...this.requestInit,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ identifier, password }),
      });
      if (!response.ok) {
        throw new Error(`StrapiClient:fetchRawResult: ${response.status} ${response.statusText}`);
      }
      const data = (await response.json()) as StrapiAuthenticationResponse;
      this.opts.jwt = data.jwt;
      this.user = data.user;
      return data.jwt;
    } catch (err) {
      this.opts.debug && console.debug('StrapiClient:login: error', loggableObject(err));
      throw err;
    }
  }

  /**
   * Performs a request against the Strapi REST API
   * @param method - The HTTP method to use
   * @param entityName - The singular name of the entity you want to query/write
   * @param id - The ID of the entity you want to query/write, or undefined
   * @param data - The POST/PUT data object to send to the Strapi API, or undefined
   * @param params - The params to pass to the Strapi API
   * @returns The response from the Strapi API
   */
  async fetchRawResult<T extends StrapiEntity>(
    method: 'get' | 'post' | 'put' | 'delete',
    entityName: string,
    id?: ID,
    data?: any,
    params?: StrapiParams,
  ): Promise<StrapiResponse> {
    this.opts.debug &&
      console.debug(
        'fetchRawResult',
        method,
        entityName,
        id,
        loggableObject(data),
        loggableObject(params),
      );
    try {
      const url = this.getEndpoint(entityName, id, params);
      this.opts.debug && console.debug('StrapiClient:fetchRawResult: url', url);
      const headers = this.opts.jwt
        ? {
            Authorization: `Bearer ${this.opts.jwt}`,
          }
        : undefined;
      this.opts.debug &&
        console.debug('StrapiClient:fetchRawResult: headers', loggableObject(headers));
      const response = await fetch(url, {
        ...this.requestInit,
        method,
        headers,
        body: JSON.stringify(data),
      });
      this.opts.debug &&
        console.debug(
          'StrapiClient:fetchRawResult: response.status',
          loggableObject(response?.status),
        );
      if (!response.ok) {
        throw new Error(`StrapiClient:fetchRawResult: ${response.status} ${response.statusText}`);
      }
      const responseData = await response.json();
      this.opts.debug &&
        console.debug('StrapiClient:fetchRawResult: response.data', loggableObject(responseData));
      return responseData as StrapiResponse;
    } catch (err) {
      this.opts.debug && console.debug('StrapiClient:fetchRawResult: error', loggableObject(err));
      throw err;
    }
  }

  /**
   * Returns the only instance of the single type of entity
   * @param entityName - The singular name of the entity you want to query
   * @param params - The params to pass to the Strapi API
   * @returns The only instance of the single type of entity
   */

  async fetchSingle<T extends StrapiEntity>(entityName: string, params?: StrapiParams): Promise<T> {
    this.opts.debug &&
      console.debug('StrapiClient:fetchSingle', entityName, loggableObject(params));
    const json = await this.fetchRawResult('get', entityName, undefined, undefined, params);
    return normaliseStrapiResponseItem<T>(json);
  }

  /**
   * Returns a single item of a given entity type with the given ID
   * @param entityName - The singular name of the entity you want to query
   * @param id - The ID of the entity you want to query
   * @param params - The params to pass to the Strapi API
   * @returns A single item of the given entity type
   */
  async fetchById<T extends StrapiEntity>(
    entityName: string,
    id: ID,
    params?: StrapiParams,
  ): Promise<T> {
    this.opts.debug &&
      console.debug('StrapiClient:fetchById', entityName, id, loggableObject(params));
    const json = await this.fetchRawResult('get', entityName, id, undefined, params);
    return normaliseStrapiResponseItem<T>(json);
  }

  /**
   * Returns a single item of a given entity type using the given params. Use
   * the `filters` and `sort` params to control which item is returned
   * @param entityName - The singular name of the entity you want to query
   * @param id - The ID of the entity you want to query
   * @param params - The params to pass to the Strapi API
   * @returns A single item of the given entity type, or null if none found
   */
  async fetchFirst<T extends StrapiEntity>(
    entityName: string,
    params?: StrapiParams,
  ): Promise<T | null> {
    this.opts.debug && console.debug('StrapiClient:fetchFirst', entityName, loggableObject(params));
    const useParams = { ...(params || {}), pagination: { page: 1, pageSize: 1 } };
    const json = await this.fetchRawResult('get', entityName, undefined, undefined, useParams);
    const array = normaliseStrapiResponseArray<T>(json);
    return array.length > 0 ? array[0] : null;
  }

  /**
   * Returns an array of items of a given entity type using the given params.
   * @param entityName - The singular name of the entity you want to query
   * @param params - The params to pass to the Strapi API
   * @returns An array of items of the given entity type
   */
  async fetchMany<T extends StrapiEntity>(
    entityName: string,
    params?: StrapiParams,
  ): Promise<StrapiPaginatedArray<T>> {
    this.opts.debug && console.debug('StrapiClient:fetchMany', entityName, loggableObject(params));
    const json = await this.fetchRawResult('get', entityName, undefined, undefined, params);
    return normaliseStrapiResponseArray<T>(json);
  }

  /**
   * Returns an array of items of a given entity type using the given params
   * and page-based pagination options
   * @param entityName - The singular name of the entity you want to query
   * @param params - The params to pass to the Strapi API
   * @param page - The page number to fetch
   * @param pageSize - The number of items to fetch per page
   * @returns An array of items of the given entity type
   */
  async fetchManyPagePaginated<T extends StrapiEntity>(
    entityName: string,
    params?: StrapiParams,
    page?: number,
    pageSize?: number,
  ): Promise<StrapiPaginatedArray<T>> {
    this.opts.debug &&
      console.debug(
        'StrapiClient:fetchManyPagePaginated',
        entityName,
        loggableObject(params),
        page,
        pageSize,
      );
    const paramsWithPagination = { ...(params || {}), pagination: { page, pageSize } };
    return this.fetchMany(entityName, paramsWithPagination);
  }

  /**
   * Returns an array of items of a given entity type using the given params
   * and offset pagination options
   * @param entityName - The singular name of the entity you want to query
   * @param params - The params to pass to the Strapi API
   * @param start - The start index to fetch from
   * @param limit - The number of items to fetch per page
   * @returns An array of items of the given entity type
   */
  async fetchManyOffsetPaginated<T extends StrapiEntity>(
    entityName: string,
    params?: StrapiParams,
    start?: number,
    limit?: number,
  ): Promise<StrapiPaginatedArray<T>> {
    this.opts.debug &&
      console.debug(
        'StrapiClient:fetchManyOffsetPaginated',
        entityName,
        loggableObject(params),
        start,
        limit,
      );
    const paramsWithPagination = { ...(params || {}), pagination: { start, limit } };
    return this.fetchMany(entityName, paramsWithPagination);
  }

  /**
   * Returns all items of a given entity type, iterating over pages until all
   * items are retrieved
   * @param entityName - The singular name of the entity you want to query
   * @param params - The params to pass to the Strapi API
   * @param limit - The number of items to fetch per page, defaults to 50
   * @param timeout - The timeout in milliseconds - an error will be thrown if
   * the timeout is exceeded before the last page is retrieved
   * @returns An array of items of the given entity type
   */
  async fetchAll<T extends StrapiEntity>(
    entityName: string,
    params?: StrapiParams,
    limit: number = 50,
    timeout?: number,
  ): Promise<T[]> {
    this.opts.debug &&
      console.debug('StrapiClient:fetchAll', entityName, loggableObject(params), limit, timeout);
    const result = [] as T[];
    const startTime = +new Date();
    let total = 0;
    let results = 0;
    let start = 0;
    do {
      if (timeout && +new Date() - timeout > startTime) {
        throw new Error('StrapiClient:fetchAll: Timeout');
      }
      const page = await this.fetchManyOffsetPaginated<T>(entityName, params, start, limit);
      result.push(...(page as T[]));
      total = page.pagination?.total || 0;
      results += page.length || 0;
      start += limit;
    } while (results < total);
    return result;
  }

  /**
   * Updates a single item of a given entity type with the given ID
   * @param entityName - The singular name of the entity you want to update
   * @param id - The ID of the entity you want to update
   * @param data - The data to update the entity with
   * @param params - The params to pass to the Strapi API
   * @returns The updated entity
   */
  async update<T extends StrapiEntity>(
    entityName: string,
    id: ID,
    data: any,
    params?: StrapiParams,
  ): Promise<T> {
    this.opts.debug &&
      console.debug(
        'StrapiClient:update',
        entityName,
        id,
        loggableObject(data),
        loggableObject(params),
      );
    const json = await this.fetchRawResult('put', entityName, id, data, params);
    return normaliseStrapiResponseItem<T>(json);
  }

  /**
   * Creates a single item of a given entity type
   * @param entityName - The singular name of the entity you want to update
   * @param data - The data to update the entity with
   * @param params - The params to pass to the Strapi API
   * @returns The created entity
   */
  async create<T extends StrapiEntity>(entityName: string, data: any, params?: any): Promise<T> {
    this.opts.debug &&
      console.debug(
        'StrapiClient:create',
        entityName,
        loggableObject(data),
        loggableObject(params),
      );
    const json = await this.fetchRawResult('post', entityName, undefined, data, params);
    return normaliseStrapiResponseItem<T>(json);
  }

  /**
   * Deletes a single item of the given entity type with the given ID
   * @param entityName - The singular name of the entity you want to update
   * @param id - The ID of the entity you want to update
   * @param params - The params to pass to the Strapi API
   * @returns The deleted entity
   */
  async delete<T extends StrapiEntity>(entityName: string, id: ID, params?: any): Promise<T> {
    this.opts.debug && console.debug('StrapiClient:delete', entityName, id, loggableObject(params));
    const json = await this.fetchRawResult('delete', entityName, id, undefined, params);
    return normaliseStrapiResponseItem<T>(json);
  }
}
