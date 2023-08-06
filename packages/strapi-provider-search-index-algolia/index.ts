import algoliasearch, { SearchClient } from 'algoliasearch';
import { omit } from 'lodash/fp';
import {
  ClearProps,
  CreateManyProps,
  CreateProps,
  DeleteManyProps,
  DeleteProps,
  ProviderInstance,
} from 'strapi-plugin-search-index';

declare var strapi: {
  log: {
    debug: Function;
  };
};

type PluginConfig = {
  providerOptions: {
    applicationId: string;
    apiKey: string;
  };
  debug: boolean;
};

type AlgoliaInstance = ProviderInstance & {
  client: SearchClient;
};

export = {
  /**
   * Initiates the algolia search provider
   *
   * @param {object} pluginConfig - Plugin configuration
   * @returns {Promise<AlgoliaInstance>} Algolia search provider
   */
  async init(pluginConfig: PluginConfig): Promise<AlgoliaInstance> {
    const {
      providerOptions: { applicationId = '', apiKey = '' },
      debug = false,
    } = pluginConfig;

    if (!applicationId.length || !apiKey.length) {
      throw new Error(
        'Algolia provider could not initialize: `applicationId` and `apiKey` must be defined on `providerOptions`.',
      );
    }

    const client = algoliasearch(applicationId, apiKey);

    await client.getApiKey(apiKey, { timeout: 3000 }).catch((error) => {
      throw new Error(`Algolia provider could not initialize: ${error.message}`);
    });

    const result: AlgoliaInstance = {
      /**
       * Algoliasearch Client
       *
       * @type {SearchClient};
       */
      client,

      /**
       * Creates the entity on a index
       *
       * @param {CreateProps} params - Paramaters
       * @param {string} params.indexName - Name of the index
       * @param {SanitizedEntity} params.data - Data of the to be created entry
       * @returns {Promise<void>} Promise with save task
       */
      create({ indexName, data }: CreateProps): Promise<void> {
        const objectID = data.objectId;
        return client
          .initIndex(indexName)
          .saveObject({ objectID, ...omit('objectId', data) })
          .then(
            () =>
              debug &&
              strapi.log.debug(
                `Algolia provider: Created entry with objectID '${objectID}' on index '${indexName}'.`,
              ),
          )
          .catch((error) => {
            throw new Error(`Algolia provider: ${error.message}`);
          });
      },

      /**
       * Updates the entity on a index
       *
       * @param {CreateProps} params - Paramaters
       * @param {string} params.indexName - Name of the index
       * @param {SanitizedEntity} params.data - Data of the to be created entry
       * @returns {Promise<void>} Promise with save task
       */
      update({ indexName, data }: CreateProps) {
        const objectID = data.objectId;
        return client
          .initIndex(indexName)
          .partialUpdateObject({ objectID, ...omit('objectId', data) }, { createIfNotExists: true })
          .then(
            () =>
              debug &&
              strapi.log.debug(
                `Algolia provider: Updated entry with objectID '${objectID}' on index '${indexName}'.`,
              ),
          )
          .catch((error) => {
            throw new Error(`Algolia provider: ${error.message}`);
          });
      },

      /**
       * Deletes the entity from a index
       *
       * @param {object} params - Paramaters
       * @param {string} params.indexName - Name of the index
       * @param {string} params.objectId - Id used for identification of the entry
       * @returns {Promise<algoliasearch.DeleteResponse>} Promise with delete task
       */
      delete({ indexName, objectId }: DeleteProps) {
        return client
          .initIndex(indexName)
          .deleteObject(objectId)
          .then(
            () =>
              debug &&
              strapi.log.debug(
                `Algolia provider: Delete entry with objectID '${objectId}' from index '${indexName}'.`,
              ),
          )
          .catch((error) => {
            throw new Error(`Algolia provider: ${error.message}`);
          });
      },

      /**
       * Creates multiple entities on a index
       *
       * @param {object} params - Paramaters
       * @param {string} params.indexName - Name of the index
       * @param {Array<CreateManyProps>} params.data - Data of the to be created entries
       * @returns {Promise<algoliasearch.ChunkedBatchResponse>} Promise with chunked task
       */
      createMany({ indexName, data }: CreateManyProps) {
        data = data.map((entry) => ({ objectID: entry.id, ...entry }));

        return client
          .initIndex(indexName)
          .saveObjects(data)
          .then(
            () =>
              debug &&
              strapi.log.debug(
                `Algolia provider: Created ${data.length} entries on index '${indexName}'.`,
              ),
          )
          .catch((error) => {
            throw new Error(`Algolia provider: ${error.message}`);
          });
      },

      /**
       * Updates multiple entities on a index
       *
       * @param {object} params - Paramaters
       * @param {string} params.indexName - Name of the index
       * @param {Array<CreateManyProps>} params.data - Data of the to be updated entries
       * @returns {Promise<algoliasearch.ChunkedBatchResponse>} Promise with chunked task
       */
      updateMany({ indexName, data }: CreateManyProps) {
        data = data.map((entry) => ({ objectID: entry.id, ...entry }));

        return client
          .initIndex(indexName)
          .partialUpdateObjects(data, { createIfNotExists: true })
          .then(
            () =>
              debug &&
              strapi.log.debug(
                `Algolia provider: Updated ${data.length} entries on index '${indexName}'.`,
              ),
          )
          .catch((error) => {
            throw new Error(`Algolia provider: ${error.message}`);
          });
      },

      /**
       * Deletes multiple entities from a index
       *
       * @param {object} params - Paramaters
       * @param {string} params.indexName - Name of the index
       * @param {Array<string>} params.objectIds - Ids used for identification of the entries
       * @returns {Promise<algoliasearch.ChunkedBatchResponse>} Promise with chunked task
       */
      deleteMany({ indexName, objectIds }: DeleteManyProps) {
        return client
          .initIndex(indexName)
          .deleteObjects(objectIds)
          .then(
            () =>
              debug &&
              strapi.log.debug(
                `Algolia provider: Deleted ${objectIds.length} entries from index '${indexName}'.`,
              ),
          )
          .catch((error) => {
            throw new Error(`Algolia provider: ${error.message}`);
          });
      },

      /**
       * Clears all entities from a index
       *
       * @param {object} params - Paramaters
       * @param {string} params.indexName - Name of the index
       * @returns {Promise<algoliasearch.ChunkedBatchResponse>} Promise with chunked task
       */
      clear({ indexName }: ClearProps): Promise<void> {
        return client
          .initIndex(indexName)
          .clearObjects()
          .then(
            () =>
              debug &&
              strapi.log.debug(`Algolia provider: Cleared all entries from index '${indexName}'.`),
          )
          .catch((error) => {
            throw new Error(`Algolia provider: ${error.message}`);
          });
      },
    };
    return result;
  },
};
