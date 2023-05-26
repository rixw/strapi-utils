import axios, { type AxiosRequestConfig } from 'axios';
import qs from 'qs';
import { StrapiEntity, StrapiPaginatedArray } from '../interfaces';
import { normaliseStrapiResponseArray, normaliseStrapiResponseItem } from '../normalise';
import pluralize from 'pluralize';
import { StrapiClientOptions, StrapiContentType } from './types';
import { defaultOptions } from './consts';

export class StrapiClient {
  opts: StrapiClientOptions;
  readonly entityMap: Map<string, StrapiContentType>;

  /**
   * StrapiClient constructor
   * @constructor
   * @param options - Constuctor options for your StrapiClient instance
   * @param options.url - The URL of your Strapi instance, defaults to http://localhost:1337
   * @param options.prefix - The prefix for your Strapi instance, defaults to /api
   * @param options.jwt - The JWT token to use for authentication if using long-lived AuthTokens
   * @param options.axiosConfig - Axios configuration options, passed directly to axios
   * @param options.contentTypes - The content types you want to use with your Strapi instance
   */
  constructor(private readonly options?: StrapiClientOptions) {
    this.opts = { ...defaultOptions, ...options };
    this.entityMap = new Map();
    this.opts?.contentTypes?.forEach((contentType) => {
      const id = `api::${contentType}.${contentType}`;
      const pluralName = pluralize(contentType);
      this.entityMap.set(contentType, { id, singularName: contentType, pluralName });
    });
  }

  private getUrl(path: string): string {
    return `${this.opts.url}${this.opts.prefix}${path}`;
  }

  public getEndpoint(entityName: string, id?: number, params?: any): string {
    const contentType = this.entityMap.get(entityName);
    const query = qs.stringify(params, { addQueryPrefix: true, encodeValuesOnly: true });
    return this.getUrl(`/${contentType?.pluralName}${id ? `/${id}` : ''}${query}`);
  }

  async login(identifier: string, password: string): Promise<string> {
    const response = await axios.get(this.getUrl('/auth/local'), {
      ...this.opts.axiosConfig,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      data: JSON.stringify({ identifier, password }),
    });
    const json = await response.data;
    this.opts.jwt = json.jwt;
    return json.jwt;
  }

  /**
   * Performs a request against the Strapi REST API
   * @param method - The HTTP method to use
   * @param entityName - The singular name of the entity you want to query/write
   * @param id - The ID of the entity you want to query/write, or undefined
   * @param data - The POST/PUT data object to send to the Strapi API, or undefined
   * @param params - The params to pass to the Strapi API
   * @returns
   */
  async fetchRawResult(
    method: 'get' | 'post' | 'put',
    entityName: string,
    id?: number,
    data?: any,
    params?: any,
  ): Promise<any> {
    const url = this.getEndpoint(entityName, id, params);
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
    return response.data;
  }

  async fetchById<T extends StrapiEntity>(
    entityName: string,
    id: number,
    params?: any,
  ): Promise<T> {
    const json = await this.fetchRawResult('get', entityName, id, undefined, params);
    return normaliseStrapiResponseItem<T>(json);
  }

  async fetchMany<T extends StrapiEntity>(
    entityName: string,
    params?: any,
  ): Promise<StrapiPaginatedArray<T>> {
    const json = await this.fetchRawResult('get', entityName, undefined, undefined, params);
    return normaliseStrapiResponseArray<T>(json);
  }

  async update<T extends StrapiEntity>(
    entityName: string,
    id: number,
    data: any,
    params?: any,
  ): Promise<T> {
    const json = await this.fetchRawResult('put', entityName, id, data, params);
    return normaliseStrapiResponseItem<T>(json);
  }

  async create<T extends StrapiEntity>(entityName: string, data: any, params?: any): Promise<T> {
    const json = await this.fetchRawResult('post', entityName, undefined, data, params);
    return normaliseStrapiResponseItem<T>(json);
  }

  async delete<T extends StrapiEntity>(entityName: string, id: number, params?: any): Promise<T> {
    const json = await this.fetchRawResult('put', entityName, id, undefined, params);
    return normaliseStrapiResponseItem<T>(json);
  }
}
