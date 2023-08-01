import { Strapi } from '@strapi/strapi';

/**
 * Bootstraps search plugin
 */
const bootstrap = async ({ strapi }: { strapi: Strapi }) => {
  strapi.log.debug('Search plugin bootstrapping...');
  const search = strapi.plugin('search');

  try {
    const store = strapi.store({
      environment: '',
      type: 'plugin',
      name: 'store',
    });

    await search.service('provider').loadProvider();

    // Todo: use store to save plugin config.
    await store.set({
      key: 'config',
      value: {},
    });

    await search.service('lifecycle').loadLifecycleMethods();
    strapi.log.debug('Search plugin bootstrapped');
  } catch (error) {
    strapi.log.error(`Search plugin bootstrap failed. ${(error as Error).message}`);
  }
};

export default bootstrap;
