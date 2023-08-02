import { EntityProps, PluginConfig, Provider } from '../../types';
import { wrapMethodWithError } from '../utils/error';
import { sanitize } from '../utils/sanitize';
import { validateProvider } from '../utils/validate';

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
    pluginConfig = pluginConfig ? pluginConfig : strapi.config.get('plugin.search');

    try {
      // Todo implement v4 package loader logic
      const provider = (await import(pluginConfig.provider)) as Provider;
      const providerInstance = await provider.init(pluginConfig);

      if (validateProvider(providerInstance)) {
        providerInstance.create = wrapMethodWithError(providerInstance.create);
        providerInstance.update = wrapMethodWithError(providerInstance.update);
        providerInstance.delete = wrapMethodWithError(providerInstance.delete);
        providerInstance.createMany = wrapMethodWithError(providerInstance.createMany);
        providerInstance.updateMany = wrapMethodWithError(providerInstance.updateMany);
        providerInstance.deleteMany = wrapMethodWithError(providerInstance.deleteMany);
        providerInstance.clear = wrapMethodWithError(providerInstance.clear);
        strapi.plugin('search').provider = providerInstance;
      }
    } catch (error) {
      strapi.plugin('search').provider = null;
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
   * @param {Array<string>} specificTypes - The type names to re-populate the indexes for; if null, re-populates all types; if empty, re-populates no types
   * @param {object} parameters - Parameters to pass to findMany
   */
  async rebuild(specificTypes: string[], parameters: object) {
    strapi.log.info('Rebuilding search indexes...');
    try {
      const {
        excludedFields = [],
        prefix: indexPrefix = '',
        contentTypes,
      } = strapi.config.get('plugin.search') as PluginConfig;
      const pluginInstance = strapi.plugin('search').provider;
      const rebuildTypes = contentTypes.filter(
        (contentType) => !specificTypes || specificTypes.includes(contentType.name),
      );
      strapi.log.debug(
        `Rebuilding search indexes for ${rebuildTypes?.length || 0} types [${(rebuildTypes || [])
          .map((type) => type.name)
          .join(', ')}]`,
      );
      for (const contentType of rebuildTypes) {
        const { name, index, prefix: idPrefix = '', fields = [] } = contentType;
        strapi.log.debug(`Rebuilding search index for ${name}`);
        if (strapi.contentTypes[name]) {
          const indexName = indexPrefix + (index ? index : name);
          strapi.log.debug(
            `Clearing search index for ${contentType.name} with parameters ${JSON.stringify(
              parameters,
            )}`,
          );
          await pluginInstance.clear({ indexName });
          const entities = (await strapi.entityService.findMany(name, parameters)) as EntityProps[]; // Potentially expensive, TODO: paginate
          strapi.log.debug(
            `Rebuilding search index for ${entities.length} entities in ${contentType.name}`,
          );
          await pluginInstance.createMany({
            indexName,
            data: entities.map((x) => ({
              ...sanitize(x, fields, excludedFields),
              id: idPrefix + x.id,
            })),
          });
        } else {
          strapi.log.error(
            `Search plugin rebuild failed: Search plugin could not rebuild index for '${name}' as it doesn't exist.`,
          );
        }
      }
    } catch (error) {
      strapi.log.error(`Search plugin rebuild failed: ${(error as Error).message}`);
    }
  },
});

export default provider;
