type StrapiWrappedEntity = {
  id: number;
  data: object;
};

type StrapiResponse = {
  data: StrapiWrappedEntity[];
  meta: { pagination: { page: number; pageSize: number; pageCount: number; total: number } };
};

export type StrapiEntity = {
  id: number;
  publishedAt?: Date;
  [string]: any;
};

export type SanitizedEntity = { id: number; objectId: string; contentType: string; [string]: any };

export type CreateProps = {
  indexName: string;
  data: SanitizedEntity;
};

export type CreateManyProps = {
  indexName: string;
  data: SanitizedEntity[];
};

export type DeleteProps = {
  indexName: string;
  objectId: string;
};

export type DeleteManyProps = {
  indexName: string;
  objectIds: string[];
};

export type ClearProps = {
  indexName: string;
};

export type ProviderInstance = {
  create: (params: CreateProps) => Promise<void>;
  update: (params: CreateProps) => Promise<void>;
  delete: (params: DeleteProps) => Promise<void>;
  createMany: (params: CreateManyProps) => Promise<void>;
  updateMany: (params: CreateManyProps) => Promise<void>;
  deleteMany: (params: DeleteManyProps) => Promise<void>;
  clear: (params: ClearProps) => Promise<void>;
};

export type Transform = (
  item: object | string | number | boolean,
) => object | string | number | boolean;

export type Transforms = {
  [string]: Transform;
};

export type ContentType = {
  name: string;
  index?: string;
  fields: string[] | '*';
  excludedFields?: string[];
  idPrefix?: string;
  transforms?: Transforms;
};

export type PluginConfig = {
  provider: string;
  providerOptions?: object;
  prefix?: string;
  excludedFields: string[];
  debug?: boolean;
  contentTypes: ContentType[];
};

export type Provider = {
  init: (pluginConfig: PluginConfig) => Promise<ProviderInstance>;
};

export type PopulateParameter = '*' | { [key: string]: boolean };

export type FindManyParameters = {
  populate: '*' | { [key: string]: boolean };
  publicationState: 'live';
  page: number;
  pageSize: number;
  fields?: string[];
};
