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
    Object.entries(transforms).map((transform) => {
      const [key, transformFn] = transform as [string, Transform];
      try {
        const originalValue = get(key, entity);
        if (originalValue) set(key, transformFn(structuredClone(originalValue)), transformedObject);
      } catch (error) {
        strapi.log.warn(`An error occured when transforming ${key}`, error);
      }
    });
  }

  if (fields.length > 0) {
    return pick(fields, entity);
  }

  return omit(excludedFields, entity);
};
