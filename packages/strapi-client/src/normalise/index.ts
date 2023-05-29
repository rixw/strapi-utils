import { DATE_PROPERTY_REGEX, ISO_DATE_REGEX } from '../constants';
import {
  StrapiEntity,
  StrapiPaginatedArray,
  StrapiPaginationOffsetResponse,
  StrapiPaginationPageResponse,
  StrapiResponse,
  StrapiResponseItem,
} from '../types';

export const recursiveNormalise = <T extends StrapiEntity>(
  item: StrapiResponseItem<T>,
  parseDates: RegExp | null = DATE_PROPERTY_REGEX,
): T => {
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
    } else if (parseDates?.test(key) && ISO_DATE_REGEX.test(value)) {
      result[key] = new Date(value);
    } else {
      result[key] = value;
    }
  }
  return result as T;
};

export const normaliseStrapiResponseArray = <T extends StrapiEntity>(
  response: StrapiResponse<T>,
  parseDates: RegExp | null = DATE_PROPERTY_REGEX,
): StrapiPaginatedArray<T> => {
  const { data, meta } = response;
  const result = (data as StrapiResponseItem<T>[]).map((item) =>
    recursiveNormalise(item, parseDates),
  ) as StrapiPaginatedArray<T>;
  result.pagination = meta.pagination as
    | StrapiPaginationPageResponse
    | StrapiPaginationOffsetResponse;
  return result;
};

export const normaliseStrapiResponseItem = <T extends StrapiEntity>(
  response: StrapiResponse<T>,
  parseDates: RegExp | null = DATE_PROPERTY_REGEX,
): T => {
  const { data } = response;
  return recursiveNormalise(data as StrapiResponseItem<T>, parseDates);
};

export const normaliseStrapiResponse = <T extends StrapiEntity>(
  response: StrapiResponse<T>,
  parseDates: RegExp | null = DATE_PROPERTY_REGEX,
): T | StrapiPaginatedArray<T> => {
  const { data } = response;
  if (Array.isArray(data)) {
    return normaliseStrapiResponseArray(response, parseDates);
  } else {
    return normaliseStrapiResponseItem(response, parseDates);
  }
};
