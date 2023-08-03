import { get, omit, pick, set } from 'lodash/fp';
import { Transform, Transforms } from '../../types';

/**
 * Sanitizes the data object by picking the specific fields or omit the specific excluded fields.
 *
 * @param {Object} entity - the entity to sanitize
 * @param {Array<string>} fields - the fields to pick from the entity
 * @param {Array<string>} excludedFields - the fields to omit from the entity
 * @returns {Object} - sanitized result
 */
export const sanitize = (
  entity: object,
  fields: string[],
  excludedFields: string[],
  transforms: Transforms,
) => {
  if (!entity) return entity;
  let transformedObject = structuredClone(entity);

  if (transforms) {
    strapi.log.debug(`Transforming object ${JSON.stringify(transformedObject)}`);
    Object.entries(transforms).map((transform) => {
      const [key, transformFn] = transform as [string, Transform];
      try {
        const originalValue = get(key, entity);
        strapi.log.debug(`Transforming ${key}, original value ${JSON.stringify(originalValue)}}`);
        if (originalValue) {
          const newValue = transformFn(structuredClone(originalValue));
          strapi.log.debug(`Transformed ${key}, new value ${JSON.stringify(newValue)}}`);
          transformedObject = set(key, newValue, transformedObject);
          strapi.log.debug(
            `Applied transformation to ${key}, new object ${JSON.stringify(transformedObject)}}`,
          );
        }
      } catch (error) {
        strapi.log.warn(`An error occured when transforming ${key}`, error);
      }
    });
    strapi.log.debug(`Final transformed entity ${JSON.stringify(transformedObject)}`);
  }

  if (fields.length > 0) {
    return pick(fields, transformedObject);
  }

  return omit(excludedFields, transformedObject);
};
