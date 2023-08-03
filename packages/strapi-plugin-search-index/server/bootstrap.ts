import { StrapiContext } from 'strapi-typed';

/**
 * Bootstraps search plugin
 */
const bootstrap = async ({ strapi }: StrapiContext) => {
  strapi.log.log('Search Index plugin bootstrapping...');
  try {
    const search = strapi.plugin('search-index');
    console.log('search-index bootstrap search', search);
    await search.service('provider').loadProvider();
    await search.service('lifecycle').loadLifecycleMethods();
    strapi.log.log('Search Index plugin bootstrapped');
  } catch (error) {
    strapi.log.error(`Search Index plugin bootstrap failed. ${(error as Error).message}`);
  }
};

export default bootstrap;
