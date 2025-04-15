import { ProviderInstance } from 'strapi-plugin-search-index';
import {
  ContentType,
  FindManyParameters,
  PluginConfig,
  PopulateParameter,
  Provider,
  StrapiEntity,
  StrapiWrappedEntity,
} from '../../types';
import { wrapMethodWithError } from '../utils/error';
import { sanitize } from '../utils/sanitize';
import { validateProvider } from '../utils/validate';

const PAGE_SIZE = 100;

export const getFieldsParameter = (contentType: ContentType): string[] | undefined => {
  if (contentType.fields === '*' || contentType.fields?.length === 0) return undefined;
  const result = [
    ...contentType.fields,
    contentType.fields.includes('id') ? undefined : 'id',
  ].filter((x) => !!x);
  return result;
};

export const getPopulateParameter = (contentType: ContentType): PopulateParameter | undefined => {
  return contentType.populate ?? undefined;
};

export const getBulkEntities = async (
  contentType: ContentType,
  ids: number[],
): Promise<StrapiWrappedEntity[]> => {
  strapi.log.debug(`Getting entities for ${contentType.name} with ${ids.length} IDs`);
  const filters = {
    id: { $in: ids },
  };
  const fields = getFieldsParameter(contentType);
  const populate = getPopulateParameter(contentType);
  // Remove populate keys from fields
  const populateKeys = Object.keys(populate ?? {});
  const filteredFields = fields?.filter((field) => !populateKeys.includes(field)) ?? [];
  const parameters: FindManyParameters = {
    publicationState: 'live',
    fields: filteredFields,
    populate,
    filters,
  };
  const entities = await strapi.entityService.findMany(contentType.name, parameters);
  strapi.log.debug(`Retrieved ${entities?.data?.length || 0} entities for ${contentType.name}`);
  return entities?.data || [];
};

const getPageOfEntities = async (
  contentType: ContentType,
  page: number,
  pageSize: number = 100,
): Promise<StrapiEntity[]> => {
  const fields = getFieldsParameter(contentType);
  const populate = getPopulateParameter(contentType);
  // Remove populate keys from fields
  const populateKeys = Object.keys(populate ?? {});
  const filteredFields = fields?.filter((field) => !populateKeys.includes(field)) ?? [];
  const parameters: FindManyParameters = {
    publicationState: 'live',
    fields: filteredFields,
    populate,
    page,
    pageSize,
  };
  return strapi.entityService.findMany(contentType.name, parameters);
};

const getAllEntities = async (contentType: ContentType): Promise<StrapiEntity[]> => {
  strapi.log.debug(`Retrieving all ${contentType.name} entities`);
  let result = [];
  let page = 1;
  let fullPage = false;
  do {
    const pageOfEntities = await getPageOfEntities(contentType, page, PAGE_SIZE);
    strapi.log.debug(`Retrieved ${pageOfEntities.length} ${contentType.name} entities`);
    result.push(...pageOfEntities);
    fullPage = pageOfEntities.length === PAGE_SIZE;
    page += 1;
  } while (fullPage);
  strapi.log.debug(`Retrieved a total of ${result.length} ${contentType.name} entities`);
  return result;
};

/**
 * Gets provider service
 *
 * @returns {object} Provider service
 */
const provider = () => ({
  /**
   * Loads provider
   *
   * @param {Config} pluginConfig - Plugin configuration
   * @param {string} [pluginConfig.provider] - Provider name
   * @param {string} [pluginConfig.resolve] - Path to provider
   */
  async loadProvider(pluginConfig: PluginConfig): Promise<void> {
    pluginConfig = pluginConfig ? pluginConfig : strapi.config.get('plugin.search-index');
    strapi.log.info('Search Index plugin loading', pluginConfig);

    try {
      const providerName = pluginConfig.provider || 'algolia';
      let useProvider: Provider;
      let modulePath: string;

      try {
        strapi.log.debug(
          `Loading provider ${providerName} as @strapi/provider-search-index-${providerName}`,
        );
        modulePath = require.resolve(`@strapi/provider-search-index-${providerName}`);
      } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
          try {
            strapi.log.debug(
              `Loading provider ${providerName} as strapi-provider-search-index-${providerName}`,
            );
            modulePath = require.resolve(`strapi-provider-search-index-${providerName}`);
          } catch (innerError) {
            if (innerError.code === 'MODULE_NOT_FOUND') {
              strapi.log.debug(`Loading provider ${providerName} as ${providerName}`);
              modulePath = providerName;
            } else {
              throw innerError;
            }
          }
        } else {
          throw error;
        }
      }

      try {
        strapi.log.debug(`Importing ${providerName} from ${modulePath}`);
        useProvider = require(modulePath) as Provider;
        strapi.log.debug(`Imported ${providerName} from ${modulePath}`);
        console.debug(`Imported ${providerName} from ${modulePath}`, useProvider);
      } catch (error) {
        const newError = new Error(
          `Could not load provider ${providerName} (resolved to ${modulePath}).`,
        );
        newError.stack = error.stack;
        throw newError;
      }

      strapi.log.debug(`Initialising provider ${providerName}`);
      const providerInstance = await useProvider.init(pluginConfig);
      console.debug(`Imported ${providerName} from ${modulePath}`, providerInstance);

      strapi.log.debug(`Validating provider instance for ${providerName}`);
      if (validateProvider(providerInstance)) {
        strapi.log.debug(`Validated provider instance for ${providerName}`);
        providerInstance.create = wrapMethodWithError(providerInstance.create);
        providerInstance.update = wrapMethodWithError(providerInstance.update);
        providerInstance.delete = wrapMethodWithError(providerInstance.delete);
        providerInstance.createMany = wrapMethodWithError(providerInstance.createMany);
        providerInstance.updateMany = wrapMethodWithError(providerInstance.updateMany);
        providerInstance.deleteMany = wrapMethodWithError(providerInstance.deleteMany);
        providerInstance.clear = wrapMethodWithError(providerInstance.clear);
        strapi.plugin('search-index').provider = providerInstance;
      }
    } catch (error) {
      strapi.plugin('search-index').provider = null;
      throw new Error(
        `Search plugin could not load provider '${pluginConfig.provider}': ${
          (error as Error).message
        }`,
      );
    }
  },

  /**
   * Clears and then re-populates search indexes by calling findMany on the content type
   *
   * @param {Array<string>} contentTypes - The type names to re-populate the indexes for; if null, re-populates all types; if empty, re-populates no types
   * @param {object} parameters - Parameters to pass to findMany
   */
  async rebuild(types: string[] | '*') {
    strapi.log.info(`Rebuilding search index: [${types === '*' ? '*' : (types || []).join(', ')}]`);
    try {
      const { contentTypes } = strapi.config.get('plugin.search-index') as PluginConfig;
      strapi.log.debug(
        `Rebuild: config content types [${contentTypes.map((x) => x.name).join(', ')}]`,
      );
      const specifiedTypes = contentTypes.filter(
        (contentType) => types === '*' || types.includes(contentType.name),
      );
      strapi.log.debug(
        `Rebuild: specified content types [${specifiedTypes.map((x) => x.name).join(', ')}]`,
      );
      const indexNames = specifiedTypes.map((type) => type.index);
      strapi.log.debug(`Rebuild: index names [${indexNames.join(', ')}]`);
      const uniqueIndexNames = indexNames.filter((n, i) => indexNames.indexOf(n) === i);
      strapi.log.debug(`Rebuild: unique index names [${indexNames.join(', ')}]`);
      const indexTypeMap = new Map<string, ContentType[]>();
      uniqueIndexNames.forEach((indexName) => {
        indexTypeMap.set(
          indexName,
          contentTypes.filter((type) => type.index === indexName),
        );
      });
      const includedContentTypes = [...indexTypeMap].reduce((acc, [indexName, types]) => {
        acc.push(...types);
        return acc;
      }, []);
      strapi.log.debug(
        `Rebuild: included content types [${includedContentTypes.map((x) => x.name).join(', ')}]`,
      );
      const invalidContentTypes = includedContentTypes.filter(
        (x) => strapi.contentTypes[x.name] === undefined,
      );
      strapi.log.debug(
        `Rebuild: invalid content types [${invalidContentTypes.map((x) => x.name).join(', ')}]`,
      );
      if (invalidContentTypes.length > 0) {
        throw new Error(
          `Unrecognised content-types in config: [${invalidContentTypes.join(', ')}]`,
        );
      }

      strapi.log.info(
        `Rebuilding search indexes for ${uniqueIndexNames.length} indexes [${uniqueIndexNames.join(
          ', ',
        )}] incorporating ${includedContentTypes.length} content-types [${includedContentTypes.join(
          ', ',
        )}]`,
      );

      const pluginInstance = strapi.plugin('search-index').provider as ProviderInstance;
      for (const index of indexTypeMap) {
        const [indexName, indexContentTypes] = index;
        strapi.log.debug(`Clearing search index ${indexName}`);
        await pluginInstance.clear({ indexName });
        for (const contentType of indexContentTypes) {
          const { name } = contentType;
          strapi.log.debug(`Rebuilding search index ${indexName} for content-type ${name}`);
          const entities = await getAllEntities(contentType);
          strapi.log.debug(
            `Adding ${entities.length} ${name} entities to search index ${indexName}`,
          );
          const sanitizedEntities = entities.map((x) => sanitize(contentType, x));
          await pluginInstance.createMany({
            indexName,
            data: sanitizedEntities,
          });
        }
      }
    } catch (error) {
      strapi.log.error(`Search plugin rebuild failed: ${(error as Error).message}`);
    }
    strapi.log.info('Rebuilding search indexes complete');
  },
});

export default provider;
