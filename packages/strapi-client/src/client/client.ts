import axios, { type AxiosRequestConfig } from 'axios';
import qs from 'qs';
import { StrapiEntity, StrapiPaginatedArray } from '../interfaces';
import { normaliseStrapiResponseArray, normaliseStrapiResponseItem } from '../normalise';

export interface StrapiContentType {
  id: string;
  singularName: string;
  pluralName: string;
}
export interface StrapiClientOptions {
  baseUrl?: string;
  contentTypes: StrapiContentType[];
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
  private readonly entityMap: Map<string, StrapiContentType>;

  constructor(private readonly options?: StrapiClientOptions) {
    this.opts = { ...defaultOptions, ...options };
    this.entityMap = new Map();
    this.opts?.contentTypes?.forEach((contentType) => {
      this.entityMap.set(contentType.id, { ...contentType });
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

  getEndpoint(entityId: string): string {
    const contentType = this.entityMap.get(entityId);
    return `${this.opts.baseUrl}/${contentType?.pluralName}`;
  }

  async fetchResult(entityId: string, id?: number | null, params?: any): Promise<any> {
    const endpoint = this.getEndpoint(entityId);
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

  async fetchById<T extends StrapiEntity>(entityId: string, id: number, params?: any): Promise<T> {
    const json = await this.fetchResult(entityId, id, params);
    return normaliseStrapiResponseItem<T>(json);
  }

  async fetchMany<T extends StrapiEntity>(
    entityId: string,
    params?: any,
  ): Promise<StrapiPaginatedArray<T>> {
    const json = await this.fetchResult(entityId, null, params);
    return normaliseStrapiResponseArray<T>(json);
  }
}
