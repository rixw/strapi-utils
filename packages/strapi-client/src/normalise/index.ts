import { ISO_DATE_REGEX } from '../constants';
import {
  StrapiEntity,
  StrapiPaginatedArray,
  StrapiPaginationOffsetResponse,
  StrapiPaginationPageResponse,
  StrapiResponse,
  StrapiResponseItem,
} from '../interfaces';

export const recursiveNormalise = <T extends StrapiEntity>(item: StrapiResponseItem<T>): T => {
  const { id, attributes, meta } = item;
  const result: Record<string, any> = {
    id,
    meta,
  };
  const attrs = Object.entries(attributes);
  for (let i = 0; i < attrs.length; i++) {
    const [key, value] = attrs[i];
    // Is this a data property?
    if (value && typeof value === 'object' && value.hasOwnProperty('data')) {
      const { data } = value;
      // console.debug('normalise data object found', key, value, data);
      if (data === null) {
        // Data null - set to null
        // console.debug('normalise data null', key, value);
        result[key] = null;
      } else if (Array.isArray(data)) {
        // Data array - map through the normalise function
        // console.debug('normalise data array', key, value, data);
        result[key] = data.map((item) => recursiveNormalise(item));
      } else {
        // Data object - normalise
        // console.debug('normalise data object', key, value, data);
        result[key] = recursiveNormalise(data);
      }
    } else if (key.endsWith('At') && ISO_DATE_REGEX.test(value)) {
      // console.debug('normalise date', key, value);
      result[key] = new Date(value);
    } else {
      // console.debug('normalise value', key, value);
      result[key] = value;
    }
  }
  return result as T;
};

export const normaliseStrapiResponseArray = <T extends StrapiEntity>(
  response: StrapiResponse<T>,
): StrapiPaginatedArray<T> => {
  const { data, meta } = response;
  const result = (data as StrapiResponseItem<T>[]).map((item) =>
    recursiveNormalise(item),
  ) as StrapiPaginatedArray<T>;
  result.pagination = meta.pagination as
    | StrapiPaginationPageResponse
    | StrapiPaginationOffsetResponse;
  console.debug('normaliseStrapiResponseArray', result);
  return result;
};

export const normaliseStrapiResponseItem = <T extends StrapiEntity>(
  response: StrapiResponse<T>,
): T => {
  const { data } = response;
  return recursiveNormalise(data as StrapiResponseItem<T>);
};

export const normaliseStrapiResponse = <T extends StrapiEntity>(
  response: StrapiResponse<T>,
): T | StrapiPaginatedArray<T> => {
  const { data } = response;
  if (Array.isArray(data)) {
    return normaliseStrapiResponseArray(response);
  } else {
    return normaliseStrapiResponseItem(response);
  }
};
