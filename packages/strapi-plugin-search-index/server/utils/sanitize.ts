import { get, omit, pick, set } from 'lodash/fp';
import { ContentType, StrapiEntity, SanitizedEntity, Transform } from './../../types';

export const getObjectId = (id: number | string, prefix?: string | null) => {
  return `${prefix || ''}${id}`;
};

/**
 * Sanitizes the data object by:
 * 1. Adding the idPrefix to the id field
 * 2. Performing any configured transforms
 * 3. picking the specific fields or omit the specific excluded fields. *
 * @param {ContentType} contentType - the content type config to use
 * @param {StrapiEntity} entity - the entity to sanitize
 * @returns {SanitizedEntity} - sanitized result
 */
export const sanitize = (contentType: ContentType, entity: StrapiEntity): SanitizedEntity => {
  // strapi.log.debug(`Sanitizing entity ${JSON.stringify(entity)}`);
  if (!entity) throw new Error('Entity is null or undefined');

  const { idPrefix, fields, excludedFields, transforms } = contentType;
  const objectId = getObjectId(entity.id, idPrefix);
  // strapi.log.debug(`Sanitizing entity prefixedId: ${objectId}`);

  let transformedObject = structuredClone(entity);
  if (transforms) {
    // strapi.log.debug(`Transforming object ${JSON.stringify(transformedObject)}`);
    Object.entries(transforms).map((transform) => {
      const [key, transformFn] = transform as [string, Transform];
      try {
        const originalValue = get(key, entity);
        // strapi.log.debug(`Transforming ${key}, original value ${JSON.stringify(originalValue)}}`);
        if (originalValue) {
          const newValue = transformFn(structuredClone(originalValue));
          // strapi.log.debug(`Transformed ${key}, new value ${JSON.stringify(newValue)}}`);
          transformedObject = set(key, newValue, transformedObject);
          // strapi.log.debug(
          //   `Applied transformation to ${key}, new object ${JSON.stringify(transformedObject)}}`,
          // );
        }
      } catch (error) {
        strapi.log.warn(`An error occured when transforming ${key}`, error);
      }
    });
    // strapi.log.debug(`Final transformed entity ${JSON.stringify(transformedObject)}`);
  }

  let filteredObject: object;
  if (fields.length > 0) {
    filteredObject = {
      ...(pick(fields, transformedObject) as object),
    };
  } else if (excludedFields && excludedFields.length > 0) {
    filteredObject = {
      ...(omit(excludedFields, transformedObject) as object),
    };
  } else {
    filteredObject = { ...transformedObject };
  }
  // strapi.log.debug(`Filtered object ${JSON.stringify(filteredObject)}`);
  const result = {
    objectId,
    id: entity.id,
    contentType: contentType.name,
    ...filteredObject,
  };
  // strapi.log.debug(`Sanitized entity ${JSON.stringify(result)}`);
  return result;
};
