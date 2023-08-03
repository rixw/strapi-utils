import bootstrap from './server/bootstrap';
import config from './server/config';
import services from './server/services';

export = () => ({
  bootstrap: ({ strapi }) => {
    strapi.log.info('Search Index plugin bootstrapping...');
    return bootstrap({ strapi });
  },
  config,
  services,
});
