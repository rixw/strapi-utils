import axios, { AxiosError, AxiosInstance } from 'axios';
import rateLimit, { RateLimitedAxiosInstance } from 'axios-rate-limit';
import pluralize from 'pluralize';
import qs from 'qs';
import { defaultOptions } from '../constants';
import {
  StrapiAuthenticationResponse,
  StrapiClientOptions,
  StrapiContentType,
  StrapiEntity,
  StrapiError,
  StrapiPaginatedArray,
  StrapiParams,
  StrapiResponse,
  StrapiUser,
} from '../types';
import { normaliseStrapiResponseArray, normaliseStrapiResponseItem } from '../normalise';

const isFullyQualifiedContentType = (contentType: string): boolean =>
  /^.+\:\:.+\..+$/.test(contentType || '');

const getContentyTypeId = (contentType: string): string =>
  isFullyQualifiedContentType(contentType) ? contentType : `api::${contentType}.${contentType}`;

const getSingularName = (contentType: string): string =>
  isFullyQualifiedContentType(contentType) ? contentType.split('.')?.slice(-1)?.[0] : contentType;

export class StrapiClient {
  opts: StrapiClientOptions;
  readonly entityMap: Map<string, StrapiContentType>;
  user?: StrapiUser;
  axiosInstance: AxiosInstance | RateLimitedAxiosInstance;

  /**
   * StrapiClient constructor
   * @constructor
   * @param options - Constuctor options for your StrapiClient instance
   * @param options.url - The URL of your Strapi instance, defaults to http://localhost:1337
   * @param options.prefix - The prefix for your Strapi instance, defaults to /api
   * @param options.jwt - The JWT token to use for authentication if using long-lived AuthTokens
   * @param options.axiosConfig - Axios configuration options, passed directly to axios
   * @param options.contentTypes - The content types you want to use with your Strapi instance
   * @param options.maxRequestsPerSecond - The maximum number of requests per second
   */
  constructor(private readonly options?: StrapiClientOptions) {
    this.opts = { ...defaultOptions, ...options };
    this.entityMap = new Map();
    this.opts?.contentTypes?.forEach((contentType) => {
      const id = getContentyTypeId(contentType);
      const singularName = getSingularName(contentType);
      const pluralName = pluralize(singularName);
      this.entityMap.set(singularName, { id, singularName, pluralName });
    });
    this.axiosInstance = this.opts.maxRequestsPerSecond
      ? rateLimit(axios.create(this.opts.axiosConfig), {
          maxRPS: this.opts.maxRequestsPerSecond,
        })
      : axios.create(this.opts.axiosConfig);
  }

  private getUrl(path: string): string {
    return `${this.opts.url}${this.opts.prefix}${path}`;
  }

  /**
   * Gets the endpoint URL for the given entity name, ID and params
   * @param entityName - The singular name of the entity you want to query/write
   * @param id - The ID of the entity you want to query/write, or undefined
   * @param params - The params to pass to the Strapi API
   * @returns The endpoint URL
   */
  public getEndpoint(
    entityName: string,
    id?: number,
    params?: StrapiParams,
    isSingleType?: boolean,
  ): string {
    const contentType = this.entityMap.get(entityName);
    const query = qs.stringify(params, { addQueryPrefix: true, encodeValuesOnly: true });
    return this.getUrl(
      `/${isSingleType ? contentType?.singularName : contentType?.pluralName}${
        id ? `/${id}` : ''
      }${query}`,
    );
  }

  /**
   * Performs login using the Strapi Users & Permissions plugin
   * @param identifier - The username or email address of the user
   * @param password - The password of the user
   * @returns A JWT token
   */
  public async login(identifier: string, password: string): Promise<string> {
    const response = await axios.get(this.getUrl('/auth/local'), {
      ...this.opts.axiosConfig,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      data: JSON.stringify({ identifier, password }),
    });
    const json = (await response.data) as StrapiAuthenticationResponse;
    this.opts.jwt = json.jwt;
    this.user = json.user;
    return json.jwt;
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
    id?: number,
    data?: any,
    params?: StrapiParams,
    isSingleType?: boolean,
  ): Promise<StrapiResponse> {
    try {
      const url = this.getEndpoint(entityName, id, params, isSingleType);
      const headers = this.opts.jwt
        ? {
            Authorization: `Bearer ${this.opts.jwt}`,
          }
        : undefined;
      const response = await axios({
        ...this.opts.axiosConfig,
        method,
        url,
        headers,
        data,
      });
      return response.data as StrapiResponse;
    } catch (err) {
      const e = err as AxiosError<StrapiError>;
      if (!e.response) {
        throw {
          data: null,
          error: {
            status: 500,
            name: 'UnknownError',
            message: e.message,
            details: e,
          },
        };
      } else {
        throw e.response.data;
      }
    }
  }

  /**
   * Returns the only instance of the single type of entity
   * @param entityName - The singular name of the entity you want to query
   * @param params - The params to pass to the Strapi API
   * @returns The only instance of the single type of entity
   */

  async fetchSingle<T extends StrapiEntity>(entityName: string, params?: StrapiParams): Promise<T> {
    const json = await this.fetchRawResult('get', entityName, undefined, undefined, params, true);
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
    id: number,
    params?: StrapiParams,
  ): Promise<T> {
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
    const result = [] as T[];
    const startTime = +new Date();
    let total = 0;
    let results = 0;
    let start = 0;
    do {
      if (timeout && +new Date() - timeout > startTime) {
        throw new Error('fetchAll: Timeout');
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
    id: number,
    data: any,
    params?: StrapiParams,
  ): Promise<T> {
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
  async delete<T extends StrapiEntity>(entityName: string, id: number, params?: any): Promise<T> {
    const json = await this.fetchRawResult('delete', entityName, id, undefined, params);
    return normaliseStrapiResponseItem<T>(json);
  }
}
