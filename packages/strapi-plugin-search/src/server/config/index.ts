import { validateConfig } from '../utils/validate';
import { PluginConfig } from '../types';

import { Strapi } from '@strapi/strapi';

declare var strapi: Strapi;

const config = {
  /**
   * Default plugin configuration
   */
  default: () => ({
    prefix: strapi.config.environment + '_',
    excludedFields: ['createdBy', 'updatedBy'],
    debug: false,
  }),

  /**
   * Validates plugin configuration
   *
   * @param {Config} config - Plugin configuration
   * @returns {object} Configuration validator
   */
  validator: (config: PluginConfig) => validateConfig(config),
};

export default config;
