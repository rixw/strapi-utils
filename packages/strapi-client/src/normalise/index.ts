import { DATE_PROPERTY_REGEX, ISO_DATE_REGEX } from '../constants';
import {
  ID,
  StrapiEntity,
  StrapiPaginatedArray,
  StrapiPaginationOffsetResponse,
  StrapiPaginationPageResponse,
  StrapiResponse,
} from '../types';

/**
 * Normalises a Strapi response item to a simple object or array of objects.
 * Acts recursively to normalise nested data properties or arrays.
 * @param item - the item to normalise
 * @param parseDates - a regex to match property names against to identify date
 * properties that will be converted to Javascript Date objects. Pass false to
 * turn off date conversion. Do not pass to use the default regex.
 * @returns The normalised item or items
 */
const recursiveNormalise = <T extends StrapiEntity>(
  item: object,
  parseDates?: RegExp | false,
): T => {
  // Validate that we have an id
  if ('id' in item === false) throw new Error('Cannot normalise item without an id');
  const { id } = item as { id: ID };
  const enableDateParsing = parseDates !== false;
  const parseDatesRegex = parseDates || DATE_PROPERTY_REGEX;
  let result: Record<string, any> = { id, meta: 'meta' in item ? item['meta'] : undefined };
  const attributes =
    'attributes' in item
      ? Object.entries(item['attributes'] as object)
      : Object.entries(item).filter((x) => x[0] !== 'id' && x[0] !== 'meta');
  for (let i = 0; i < attributes.length; i++) {
    const [key, value] = attributes[i];
    // Is this a data property?
    if (value && typeof value === 'object' && value.hasOwnProperty('data')) {
      const { data } = value as { data: object | null };
      if (data === null) {
        // Data null - set to null
        result[key] = null;
      } else if (Array.isArray(data)) {
        // Data array - map through the normalise function
        result[key] = data.map((item) => recursiveNormalise(item));
      } else {
        // Data object - normalise
        result[key] = recursiveNormalise(data);
      }
    } else if (enableDateParsing && parseDatesRegex?.test(key) && ISO_DATE_REGEX.test(value)) {
      result[key] = new Date(value);
    } else {
      result[key] = value;
    }
  }
  return result as T;
};

/**
 * Normalises a Strapi response to an array of simple objects.
 * Acts recursively to normalise nested data properties or arrays.
 * @param response - The raw Strapi API response
 * @param parseDates - a regex to match property names against to identify date
 * properties that will be converted to Javascript Date objects. Pass false to
 * turn off date conversion. Do not pass to use the default regex.
 * @returns The normalised items
 */
export const normaliseStrapiResponseArray = <T extends StrapiEntity>(
  response: StrapiResponse,
  parseDates?: RegExp | false,
): StrapiPaginatedArray<T> => {
  const { data, meta } = response;
  const result = (data as object[]).map((item) =>
    recursiveNormalise(item, parseDates),
  ) as StrapiPaginatedArray<T>;
  result.pagination = meta.pagination as
    | StrapiPaginationPageResponse
    | StrapiPaginationOffsetResponse;
  return result;
};

/**
 * Normalises a Strapi response item to a simple object.
 * Acts recursively to normalise nested data properties or arrays.
 * @param response - The raw Strapi API response
 * @param parseDates - a regex to match property names against to identify date
 * properties that will be converted to Javascript Date objects. Pass false to
 * turn off date conversion. Do not pass to use the default regex.
 * @returns The normalised item
 */
export const normaliseStrapiResponseItem = <T extends StrapiEntity>(
  response: StrapiResponse,
  parseDates?: RegExp | false,
): T => {
  const { data } = response;
  return recursiveNormalise(data, parseDates) as T;
};

/**
 * Normalises a Strapi response item to a simple object or array of objects.
 * Acts recursively to normalise nested data properties or arrays.
 * @param response - The raw Strapi API response
 * @param parseDates - a regex to match property names against to identify date
 * properties that will be converted to Javascript Date objects. Pass false to
 * turn off date conversion. Do not pass to use the default regex.
 * @returns The normalised item
 */
export const normaliseStrapiResponse = <T extends StrapiEntity>(
  response: StrapiResponse,
  parseDates?: RegExp | false,
): T | StrapiPaginatedArray<T> => {
  const { data } = response;
  if (Array.isArray(data)) {
    return normaliseStrapiResponseArray<T>(response, parseDates);
  } else {
    return normaliseStrapiResponseItem<T>(response, parseDates);
  }
};
