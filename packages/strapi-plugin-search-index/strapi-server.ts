import bootstrap from './server/bootstrap';
import config from './server/config';
import services from './server/services';

export = () => ({
  register: ({ strapi }) => {
    strapi.log.log('Top level register');
  },
  bootstrap: ({ strapi }) => {
    strapi.log.log('Top level bootstrap');
  },
  config,
  services,
});
