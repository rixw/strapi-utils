import { Event } from '@strapi/database/lib/lifecycles';
import { has } from 'lodash/fp';
import { PluginConfig } from '../../types';
import { sanitize } from '../utils/sanitize';

type AfterEvent = Event & {
  result: {
    id: string;
    publishedAt?: Date;
  };
};

type Lifecycle = {
  loadLifecycleMethods: () => Promise<void>;
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
      const provider = strapi.plugin('search-index').provider;
      const {
        excludedFields = [],
        prefix: indexPrefix = '',
        contentTypes,
      } = strapi.config.get('plugin.search-index') as PluginConfig;

      // Loop over configured contentTypes in ./config/plugins.js
      contentTypes &&
        contentTypes.forEach((contentType) => {
          strapi.log.info('Loading lifecycle methods for ', contentType);
          const { name, index, prefix: idPrefix = '', fields = [], transforms = {} } = contentType;

          if (strapi.contentTypes[name]) {
            const indexName = indexPrefix + (index ? index : name);

            const checkPublicationState = (event: AfterEvent) => {
              strapi.log.info('checkPublicationState', event);
              if (
                event.result &&
                has('publishedAt', event.result) &&
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

              async afterCreate(event: Event) {
                strapi.log.info('afterCreate', event);
                checkPublicationState(event as AfterEvent)
                  ? provider.create({
                      indexName,
                      // @ts-ignore
                      data: sanitize(event.result, fields, excludedFields, transforms),
                      // @ts-ignore
                      id: idPrefix + event.result.id,
                    })
                  : noop();
              },

              // Todo: Fix `afterCreateMany` event result only has an count, it doesn't provide an array of result objects.
              // async afterCreateMany(event) {
              //   const { result } = event;
              //   await provider.createMany({
              //     indexName,
              //     data: result.map((entity) => ({ ...sanitize(entity), id: idPrefix + entity.id })),
              //   });
              // },

              async afterUpdate(event) {
                strapi.log.info('afterUpdate', event);
                checkPublicationState(event as AfterEvent)
                  ? provider.create({
                      indexName,
                      data: sanitize(
                        (event as AfterEvent).result,
                        fields,
                        excludedFields,
                        transforms,
                      ),
                      id: idPrefix + (event as AfterEvent).result.id,
                    })
                  : provider.delete({
                      indexName,
                      id: idPrefix + (event as AfterEvent).result.id,
                    });
              },

              // Todo: Fix `afterUpdateMany` event result only has an count, it doesn't provide an array of result objects.
              // async afterUpdateMany(event) {
              //   const { result } = event;
              //   await provider.updateMany({
              //     indexName,
              //     data: result.map((entity) => ({ ...sanitize(entity), id: idPrefix + entity.id })),
              //   });
              // },

              async afterDelete(event) {
                strapi.log.info('afterDelete', event);
                provider.delete({ indexName, id: idPrefix + (event as AfterEvent).result.id });
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
          } else {
            strapi.log.error(
              `Search plugin bootstrap failed: Search plugin could not load lifecycles on model '${name}' as it doesn't exist.`,
            );
          }
        });
    },
  } as Lifecycle);

export default lifecycle;
