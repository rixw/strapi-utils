import { Event } from '@strapi/database/lib/lifecycles';
import { getObjectId, sanitize } from '../utils/sanitize';
import {
  ContentType,
  PluginConfig,
  ProviderInstance,
  StrapiEntity,
  StrapiWrappedEntity,
} from './../../types';
import { getFieldsParameter, getPopulateParameter } from './provider';

type AfterEvent = Event & {
  result: StrapiEntity;
};

type AfterBulkEvent = Event & {
  result: {
    count: number;
    ids: number[];
  };
};

type Lifecycle = {
  loadLifecycleMethods: () => Promise<void>;
};

const getBulkEntities = async (
  contentType: ContentType,
  ids: number[],
): Promise<StrapiWrappedEntity[]> => {
  strapi.log.debug(`Getting entities for ${contentType.name} with ${ids.length} IDs`);
  const filters = {
    id: { $in: ids },
  };
  const fields = getFieldsParameter(contentType);
  const populate = getPopulateParameter(fields);
  const parameters = !!fields
    ? {
        fields,
        populate,
        filters,
      }
    : {
        filters,
      };
  const entities = await strapi.entityService.findMany(contentType.name, parameters);
  strapi.log.debug(`Retrieved ${entities?.data?.length || 0} entities for ${contentType.name}`);
  return entities?.data || [];
};

/**
 * Gets lifecycle service
 *
 * @returns {object} Lifecycle service
 */
const lifecycle = (): Lifecycle =>
  ({
    /**
     * Load provider methods into lifecycles
     */
    async loadLifecycleMethods() {
      strapi.log.info('Loading lifecycle methods...');
      const provider = strapi.plugin('search-index').provider as ProviderInstance;
      const { contentTypes } = strapi.config.get('plugin.search-index') as PluginConfig;

      // Loop over configured contentTypes in ./config/plugins.js
      contentTypes &&
        contentTypes.forEach((contentType) => {
          strapi.log.info('Loading lifecycle methods for ', contentType);
          const { name, index: indexName, idPrefix = '' } = contentType;

          if (!strapi.contentTypes[name]) {
            throw new Error(`Content type ${name} in Search Index config not found in Strapi`);
          }

          const checkPublicationState = (event: AfterEvent) => {
            strapi.log.debug('checkPublicationState', event);
            if (
              event.result &&
              event.result.publishedAt !== undefined &&
              event.result.publishedAt === null
            ) {
              // Draft
              return false;
            } else {
              // Published OR not enabled for content type
              return true;
            }
          };

          const noop = () => {};

          strapi.db.lifecycles.subscribe({
            // @ts-ignore
            models: [name],

            async afterCreate(event: AfterEvent) {
              strapi.log.info('afterCreate', event);
              checkPublicationState(event)
                ? (provider as ProviderInstance).create({
                    indexName,
                    data: sanitize(contentType, event.result),
                  })
                : noop();
            },

            async afterCreateMany(event: AfterBulkEvent) {
              const { result } = event;
              const { ids } = result;
              const entities = await getBulkEntities(contentType, ids);
              await provider.createMany({
                indexName,
                data: entities.map((entity) => sanitize(contentType, entity)),
              });
            },

            async afterUpdate(event: AfterEvent) {
              strapi.log.info('afterUpdate', event);
              checkPublicationState(event)
                ? provider.create({
                    indexName,
                    data: sanitize(contentType, event.result),
                  })
                : provider.delete({
                    indexName,
                    objectId: getObjectId(event.result.id, idPrefix),
                  });
            },

            // async afterUpdateMany(event: AfterBulkEvent) {
            //   const { result } = event;
            //   await provider.updateMany({
            //     indexName,
            //     data: result.map((entity) => ({ ...sanitize(entity), id: idPrefix + entity.id })),
            //   });
            // },

            async afterDelete(event: AfterEvent) {
              strapi.log.info('afterDelete', event);
              provider.delete({ indexName, objectId: getObjectId(event.result.id, idPrefix) });
            },

            // Todo: Fix `afterDeleteMany` lifecycle not correctly triggered in `em.deleteMany()`, it also doesn't provide an array of result objects.
            // https://github.com/strapi/strapi/blob/a4c27836b481210d93acf932b7edd2ec1350d070/packages/core/database/lib/entity-manager.js#L325-L340
            // async afterDeleteMany(event) {
            //   const { result } = event;
            //   await provider.deleteMany({
            //     indexName,
            //     ids: result.map((entity) => idPrefix + entity.id),
            //   });
            // },
          });
        });
    },
  } as Lifecycle);

export default lifecycle;
