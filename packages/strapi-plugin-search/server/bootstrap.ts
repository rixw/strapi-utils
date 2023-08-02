import { StrapiContext } from 'strapi-typed';

/**
 * Bootstraps search plugin
 */
const bootstrap = async ({ strapi }: StrapiContext) => {
  strapi.log.log('Search plugin bootstrapping...');
  try {
    const search = strapi.plugin('search');
    await search.service('provider').loadProvider();
    await search.service('lifecycle').loadLifecycleMethods();
    strapi.log.log('Search plugin bootstrapped');
  } catch (error) {
    strapi.log.error(`Search plugin bootstrap failed. ${(error as Error).message}`);
  }
};

export default bootstrap;
