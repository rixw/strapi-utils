import bootstrap from './server/bootstrap';
import config from './server/config';
import services from './server/services';

export = () => ({
  bootstrap: ({ strapi }) => {
    strapi.log.log('Top level bootstrap');
    return bootstrap({ strapi });
  },
  config,
  services,
});
