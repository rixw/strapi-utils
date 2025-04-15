import { ProviderInstance } from 'strapi-plugin-search-index';
import {
  ContentType,
  FindManyParameters,
  PluginConfig,
  PopulateParameter,
  Provider,
  StrapiEntity,
} from '../../types';
import { wrapMethodWithError } from '../utils/error';
import { sanitize } from '../utils/sanitize';
import { validateProvider } from '../utils/validate';

const PAGE_SIZE = 100;

export const getFieldsParameter = (contentType: ContentType): string[] | undefined => {
  if (contentType.fields === '*' || contentType.fields?.length === 0) return undefined;
  strapi.log.debug(`Getting field parameters for to [${contentType.fields.join(', ')}]`);
  const result = [
    ...contentType.fields,
    contentType.fields.includes('id') ? undefined : 'id',
  ].filter((x) => !!x);
  return result;
};

export const getPopulateParameter = (fieldParameter: string[] | null): PopulateParameter => {
  strapi.log.debug(
    `Getting poulate parameter for [${fieldParameter ? fieldParameter.join(', ') : '*'}]`,
  );
  if (!fieldParameter) return '*';
  const result: { [key: string]: boolean } = {};
  fieldParameter.forEach((x) => (result.populate[x] = true));
  return result;
};

const getPageOfEntities = async (
  contentType: ContentType,
  page: number,
  pageSize: number,
): Promise<StrapiEntity[]> => {
  let parameters: FindManyParameters = {
    populate: '*',
    publicationState: 'live',
    page,
    pageSize,
  };
  strapi.log.debug(`Querying page ${page} size ${pageSize} of ${contentType.name} entities`);
  const fields = getFieldsParameter(contentType);
  if (fields) {
    parameters.fields = fields;
    parameters.populate = getPopulateParameter(fields);
  }
  strapi.log.debug(`Find many parameters ${JSON.stringify(parameters)}`);
  return strapi.entityService.findMany(contentType.name, parameters);
};

const getAllEntities = async (contentType: ContentType): Promise<StrapiEntity[]> => {
  strapi.log.debug(`Retrieving all ${contentType.name} entities`);
  let result = [];
  let page = 1;
  let fullPage = false;
  do {
    strapi.log.debug(`Retrieving page ${page} (size ${PAGE_SIZE}) of ${contentType.name} entities`);
    const pageOfEntities = await getPageOfEntities(contentType, page, PAGE_SIZE);
    console.debug('Page of entities', pageOfEntities);
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
          console.debug('entities', entities);
          strapi.log.debug(
            `Adding ${entities.length} ${name} entities to search index ${indexName}`,
          );
          const sanitizedEntities = entities.map((x) => sanitize(contentType, x));
          console.debug('sanitizedEntities', sanitizedEntities);
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
