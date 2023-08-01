export type EntityProps = {
  data: object & { id?: string };
  id: string;
};

export type CreateProps = EntityProps & {
  indexName: string;
};

export type DeleteProps = Omit<CreateProps, 'data'>;

export type CreateManyProps = {
  indexName: string;
  data: CreateProps[];
};

export type DeleteManyProps = {
  indexName: string;
  ids: string[];
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

export type PluginConfig = {
  provider: string;
  providerOptions?: object;
  prefix?: string;
  excludedFields: string[];
  debug?: boolean;
  contentTypes: Array<{ name: string; index?: string; fields: string[]; prefix?: string }>;
};

export type Provider = {
  init: (pluginConfig: PluginConfig) => Promise<ProviderInstance>;
};
