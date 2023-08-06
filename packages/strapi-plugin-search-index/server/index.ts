import bootstrap from './bootstrap';
import config from './config';
import controllers from './controllers';
import routes from './routes';
import services from './services';

export = () => {
  return {
    bootstrap,
    config,
    controllers,
    routes,
    services,
    type: 'content-api',
  };
};
