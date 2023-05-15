import axios, { type AxiosRequestConfig } from 'axios';
import qs from 'qs';
import { StrapiEntity, StrapiPaginatedArray } from '../interfaces';
import { normaliseStrapiResponseArray, normaliseStrapiResponseItem } from '../normalise';
import pluralize from 'pluralize';

export interface StrapiContentType {
  id: string;
  singularName: string;
  pluralName: string;
}
export interface StrapiClientOptions {
  baseUrl?: string;
  contentTypes: string[];
  jwt?: string | null;
  axiosConfig?: AxiosRequestConfig;
}

export const defaultOptions: StrapiClientOptions = {
  baseUrl: 'http://127.0.0.1:1337/api',
  contentTypes: [],
  jwt: null,
  axiosConfig: {},
};

export class StrapiClient {
  opts: StrapiClientOptions;
  readonly entityMap: Map<string, StrapiContentType>;

  constructor(private readonly options?: StrapiClientOptions) {
    this.opts = { ...defaultOptions, ...options };
    this.entityMap = new Map();
    this.opts?.contentTypes?.forEach((contentType) => {
      const id = `api::${contentType}.${contentType}`;
      const pluralName = pluralize(contentType);
      this.entityMap.set(contentType, { id, singularName: contentType, pluralName });
    });
  }

  async login(identifier: string, password: string): Promise<string> {
    const response = await axios.get(`${this.opts.baseUrl}/auth/local`, {
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

  getEndpoint(entityName: string): string {
    const contentType = this.entityMap.get(entityName);
    return `${this.opts.baseUrl}/${contentType?.pluralName}`;
  }

  async fetchResult(entityName: string, id?: number | null, params?: any): Promise<any> {
    const endpoint = this.getEndpoint(entityName);
    const query = qs.stringify(params, { addQueryPrefix: true, encodeValuesOnly: true });
    const headers = this.opts.jwt
      ? {
          Authorization: `Bearer ${this.opts.jwt}`,
        }
      : undefined;
    const url = `${endpoint}${id ? `/${id}` : ''}${query ? `${query}` : ''}`;
    const response = await axios.get(url, {
      ...this.opts.axiosConfig,
      headers,
    });
    return response.data;
  }

  async fetchById<T extends StrapiEntity>(
    entityName: string,
    id: number,
    params?: any,
  ): Promise<T> {
    const json = await this.fetchResult(entityName, id, params);
    return normaliseStrapiResponseItem<T>(json);
  }

  async fetchMany<T extends StrapiEntity>(
    entityName: string,
    params?: any,
  ): Promise<StrapiPaginatedArray<T>> {
    const json = await this.fetchResult(entityName, null, params);
    return normaliseStrapiResponseArray<T>(json);
  }
}
