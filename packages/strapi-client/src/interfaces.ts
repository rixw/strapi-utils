export interface StrapiEntity {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  publishedAt?: Date;
}

export interface StrapiPaginationPageRequest {
  page?: number;
  pageSize?: number;
  withCount?: boolean;
}

export interface StrapiPaginationOffsetRequest {
  start?: number;
  limit?: number;
  withCount?: boolean;
}

export interface StrapiPaginationPageResponse {
  page: number;
  pageSize: number;
  pageCount?: number;
  total?: number;
}

export interface StrapiPaginationOffsetResponse {
  start: number;
  limit: number;
  total?: number;
}

export interface StrapiMetaResponse {
  pagination?: StrapiPaginationPageResponse | StrapiPaginationOffsetResponse;
}

export interface StrapiResponseAuditFields {
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export interface StrapiResponseItem<T extends StrapiEntity> {
  id: number;
  attributes: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'publishedAt'> | StrapiResponseAuditFields;
  meta?: StrapiMetaResponse;
}

export interface StrapiResponse<T extends StrapiEntity> {
  data: StrapiResponseItem<T> | StrapiResponseItem<T>[];
  meta: StrapiMetaResponse;
}

export interface StrapiPaginatedArray<T extends StrapiEntity> extends Array<T> {
  pagination: StrapiPaginationPageResponse | StrapiPaginationOffsetResponse;
}

export interface StrapiPopulate {
  [key: string]:
    | boolean
    | {
        on: {
          fields?: string[];
          populate: StrapiPopulate;
        };
      }
    | {
        fields?: string[];
        sort?: string | string[];
        filters?: StrapiFilters;
        populate?: '*' | string[] | StrapiPopulate;
      };
}

export type StrapiFilterOperator =
  | '$eq'
  | '$eqi'
  | '$ne'
  | '$lt'
  | '$lte'
  | '$gt'
  | '$gte'
  | '$in'
  | '$notIn'
  | '$contains'
  | '$notContains'
  | '$containsi'
  | '$notContainsi'
  | '$startsWith'
  | '$startsWithi'
  | '$endsWith'
  | '$endsWithi'
  | '$null'
  | '$notNull'
  | '$between';

export type StrapiFilterGrouping = '$and' | '$or' | '$not';

export interface StrapiFilters {
  [key: string]: StrapiFilterWithOperator | StrapiFilterWithGrouping;
}

export type StrapiFilterWithOperator = {
  [key in StrapiFilterOperator]: string | string[] | number | number[] | boolean;
};

export type StrapiFilterWithGrouping = {
  [key in StrapiFilterGrouping]: StrapiFilters[];
};

export interface StrapiParams {
  sort?: string | string[];
  filters?: StrapiFilters;
  populate?: '*' | string[] | StrapiPopulate;
  fields?: string[];
  pagination: StrapiPaginationPageRequest | StrapiPaginationOffsetRequest;
  publicationState?: 'preview' | 'live';
  locale?: string | string[];
}
