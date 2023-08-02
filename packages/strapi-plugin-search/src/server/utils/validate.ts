import { yup } from '@strapi/utils';
import { PluginConfig, ProviderInstance } from '../types';

const PROVIDER_METHODS = [
  'create',
  'update',
  'delete',
  'createMany',
  'updateMany',
  'deleteMany',
  'clear',
];

/**
 * Validates plugin configuration
 *
 * @param {object} config - Plugin configuration
 */
const validateConfig = (config: PluginConfig) => {
  try {
    yup
      .object()
      .shape({
        provider: yup.string().required(),
        providerOptions: yup.object(),
        prefix: yup.string(),
        excludedFields: yup.array().of(yup.string().required()),
        debug: yup.boolean(),
        contentTypes: yup.array().of(
          yup.object().shape({
            name: yup.string().required(),
            index: yup.string(),
            fields: yup.array().of(yup.string().required()),
          }),
        ),
      })
      .validateSync(config);
  } catch (error) {
    throw new Error(
      `Search plugin ConfigValidationError: ${(error as { errors: string[] }).errors}`,
    );
  }
};

// Todo: move function to provider service if function keeps simple.
/**
 * Validates search provider
 *
 * @param {object} provider - Search Provider
 * @returns {boolean} - True
 */
const validateProvider = (provider: ProviderInstance) => {
  PROVIDER_METHODS.forEach((method) => {
    if (typeof Object.entries(provider).find(([key]) => key === method) !== 'function') {
      throw new Error(
        `Provider validation Error: Required method '${method}' isn't implemented in the provider.`,
      );
    }
  });

  return true;
};

export { PROVIDER_METHODS, validateConfig, validateProvider, yup };
