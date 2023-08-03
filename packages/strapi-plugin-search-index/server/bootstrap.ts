import { Strapi } from '@strapi/strapi';

/**
 * Bootstraps search plugin
 */
const bootstrap = async ({ strapi }: { strapi: Strapi }) => {
  strapi.log.info('Search Index plugin bootstrapping...');
  try {
    const search = strapi.plugin('search-index');
    await search.service('provider').loadProvider();
    await search.service('lifecycle').loadLifecycleMethods();
    strapi.log.info('Search Index plugin bootstrapped');
  } catch (error) {
    strapi.log.error(`Search Index plugin bootstrap failed. ${(error as Error).message}`);
  }
};

export default bootstrap;
