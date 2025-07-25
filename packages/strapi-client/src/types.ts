import type { AxiosRequestConfig } from 'axios';

export type ID = number | string;

export type StrapiAuthenticationResponse = {
  user: Record<string, unknown>;
  jwt: string;
};

export type StrapiEntity = {
  id?: ID;
  createdAt?: Date;
  updatedAt?: Date;
  publishedAt?: Date;
};

export type StrapiPaginationPageRequest = {
  page?: number;
  pageSize?: number;
  withCount?: boolean;
};

export type StrapiPaginationOffsetRequest = {
  start?: number;
  limit?: number;
  withCount?: boolean;
};

export type StrapiPaginationPageResponse = {
  page: number;
  pageSize: number;
  pageCount?: number;
  total?: number;
};

export type StrapiPaginationOffsetResponse = {
  start: number;
  limit: number;
  total?: number;
};

export type StrapiMetaResponse = {
  pagination?: StrapiPaginationPageResponse | StrapiPaginationOffsetResponse;
};

export type StrapiResponse = {
  data: object | object[];
  meta: StrapiMetaResponse;
};

export type StrapiPaginatedArray<T extends StrapiEntity> = Array<T> & {
  pagination: StrapiPaginationPageResponse | StrapiPaginationOffsetResponse;
};

export type StrapiPopulate = {
  [key: string]:
    | '*'
    | boolean
    | {
        on: {
          fields?: string[];
          populate: StrapiPopulate;
        };
      }
    | {
        fields?: string[];
        sort?: string | string[];
        filters?: StrapiFilters;
        populate?: '*' | string[] | StrapiPopulate;
      };
};

export type StrapiFilterOperator =
  | '$eq'
  | '$eqi'
  | '$ne'
  | '$lt'
  | '$lte'
  | '$gt'
  | '$gte'
  | '$in'
  | '$notIn'
  | '$contains'
  | '$notContains'
  | '$containsi'
  | '$notContainsi'
  | '$startsWith'
  | '$startsWithi'
  | '$endsWith'
  | '$endsWithi'
  | '$null'
  | '$notNull'
  | '$between';

export type StrapiFilterGrouping = '$and' | '$or' | '$not';

export type StrapiFilterWithGrouping = {
  [key in StrapiFilterGrouping]?: StrapiFilters[];
};

export type StrapiFilterOperand = string | string[] | number | number[] | boolean | Date | Date[];

export type StrapiFilterWithOperator = {
  [key in StrapiFilterOperator]?: StrapiFilterOperand;
};

export type StrapiFiltersWithOperator = {
  [key: string]: StrapiFilterWithOperator;
};

export type StrapiFiltersWithNesting = {
  [key: string]: StrapiFiltersWithNesting | StrapiFiltersWithOperator;
};

export type StrapiFilters =
  | StrapiFilterWithGrouping
  | StrapiFiltersWithOperator
  | StrapiFiltersWithNesting;

export type StrapiParams = {
  sort?: string | string[];
  filters?: StrapiFilters;
  populate?: string | string[] | StrapiPopulate;
  fields?: string[];
  pagination?: StrapiPaginationPageRequest | StrapiPaginationOffsetRequest;
  publicationState?: 'preview' | 'live';
  locale?: StrapiLocale | StrapiLocale[];
};

export type StrapiLocale =
  | 'af'
  | 'af-NA'
  | 'af-ZA'
  | 'agq'
  | 'agq-CM'
  | 'ak'
  | 'ak-GH'
  | 'sq'
  | 'sq-AL'
  | 'am'
  | 'am-ET'
  | 'ar'
  | 'ar-DZ'
  | 'ar-BH'
  | 'ar-EG'
  | 'ar-IQ'
  | 'ar-JO'
  | 'ar-KW'
  | 'ar-LB'
  | 'ar-LY'
  | 'ar-MA'
  | 'ar-OM'
  | 'ar-QA'
  | 'ar-SA'
  | 'ar-SD'
  | 'ar-SY'
  | 'ar-TN'
  | 'ar-AE'
  | 'ar-001'
  | 'ar-YE'
  | 'hy'
  | 'hy-AM'
  | 'as'
  | 'as-IN'
  | 'asa'
  | 'asa-TZ'
  | 'az'
  | 'az-Cyrl'
  | 'az-Cyrl-AZ'
  | 'az-Latn'
  | 'az-Latn-AZ'
  | 'ksf'
  | 'ksf-CM'
  | 'bm'
  | 'bm-ML'
  | 'bas'
  | 'bas-CM'
  | 'eu'
  | 'eu-ES'
  | 'be'
  | 'be-BY'
  | 'bem'
  | 'bem-ZM'
  | 'bez'
  | 'bez-TZ'
  | 'bn'
  | 'bn-BD'
  | 'bn-IN'
  | 'brx'
  | 'brx-IN'
  | 'bs'
  | 'bs-BA'
  | 'br'
  | 'br-FR'
  | 'bg'
  | 'bg-BG'
  | 'my'
  | 'my-MM'
  | 'ca'
  | 'ca-ES'
  | 'ckb'
  | 'tzm'
  | 'tzm-Latn'
  | 'tzm-Latn-MA'
  | 'chr'
  | 'chr-US'
  | 'cgg'
  | 'cgg-UG'
  | 'zh'
  | 'zh-Hans'
  | 'zh-CN'
  | 'zh-Hans-CN'
  | 'zh-Hans-HK'
  | 'zh-Hans-MO'
  | 'zh-Hans-SG'
  | 'zh-Hant'
  | 'zh-Hant-HK'
  | 'zh-Hant-MO'
  | 'zh-Hant-TW'
  | 'swc'
  | 'swc-CD'
  | 'kw'
  | 'kw-GB'
  | 'hr'
  | 'hr-HR'
  | 'cs'
  | 'cs-CZ'
  | 'da'
  | 'da-DK'
  | 'dua'
  | 'dua-CM'
  | 'nl'
  | 'nl-AW'
  | 'nl-BE'
  | 'nl-CW'
  | 'nl-NL'
  | 'nl-SX'
  | 'ebu'
  | 'ebu-KE'
  | 'en'
  | 'en-AS'
  | 'en-AU'
  | 'en-BB'
  | 'en-BE'
  | 'en-BZ'
  | 'en-BM'
  | 'en-BW'
  | 'en-CA'
  | 'en-EG'
  | 'en-EU'
  | 'en-GU'
  | 'en-GY'
  | 'en-HK'
  | 'en-IN'
  | 'en-IE'
  | 'en-JM'
  | 'en-MT'
  | 'en-MH'
  | 'en-MU'
  | 'en-NA'
  | 'en-NZ'
  | 'en-MP'
  | 'en-PK'
  | 'en-PH'
  | 'en-SA'
  | 'en-SG'
  | 'en-ZA'
  | 'en-TT'
  | 'en-AE'
  | 'en-UM'
  | 'en-VI'
  | 'en-US-POSIX'
  | 'en-GB'
  | 'en-US'
  | 'en-ZW'
  | 'eo'
  | 'et'
  | 'et-EE'
  | 'ee'
  | 'ee-GH'
  | 'ee-TG'
  | 'ewo'
  | 'ewo-CM'
  | 'fo'
  | 'fo-FO'
  | 'fil'
  | 'fil-PH'
  | 'fi'
  | 'fi-FI'
  | 'fr'
  | 'fr-BE'
  | 'fr-BJ'
  | 'fr-BF'
  | 'fr-BI'
  | 'fr-CM'
  | 'fr-CA'
  | 'fr-CF'
  | 'fr-TD'
  | 'fr-KM'
  | 'fr-CG'
  | 'fr-CD'
  | 'fr-CI'
  | 'fr-DJ'
  | 'fr-GQ'
  | 'fr-FR'
  | 'fr-GF'
  | 'fr-GA'
  | 'fr-GP'
  | 'fr-GN'
  | 'fr-LU'
  | 'fr-MG'
  | 'fr-ML'
  | 'fr-MQ'
  | 'fr-YT'
  | 'fr-MC'
  | 'fr-NE'
  | 'fr-RW'
  | 'fr-RE'
  | 'fr-BL'
  | 'fr-MF'
  | 'fr-SN'
  | 'fr-CH'
  | 'fr-TG'
  | 'ff'
  | 'ff-SN'
  | 'gl'
  | 'gl-ES'
  | 'lg'
  | 'lg-UG'
  | 'ka'
  | 'ka-GE'
  | 'de'
  | 'de-AT'
  | 'de-BE'
  | 'de-DE'
  | 'de-LI'
  | 'de-LU'
  | 'de-CH'
  | 'el'
  | 'el-CY'
  | 'el-GR'
  | 'gu'
  | 'gu-IN'
  | 'guz'
  | 'guz-KE'
  | 'ha'
  | 'ha-Latn'
  | 'ha-Latn-GH'
  | 'ha-Latn-NE'
  | 'ha-Latn-NG'
  | 'haw'
  | 'haw-US'
  | 'he'
  | 'he-IL'
  | 'hi'
  | 'hi-IN'
  | 'hu'
  | 'hu-HU'
  | 'is'
  | 'is-IS'
  | 'ig'
  | 'ig-NG'
  | 'id'
  | 'id-ID'
  | 'ga'
  | 'ga-IE'
  | 'it'
  | 'it-IT'
  | 'it-CH'
  | 'ja'
  | 'ja-JP'
  | 'dyo'
  | 'dyo-SN'
  | 'kea'
  | 'kea-CV'
  | 'kab'
  | 'kab-DZ'
  | 'kl'
  | 'kl-GL'
  | 'kln'
  | 'kln-KE'
  | 'kam'
  | 'kam-KE'
  | 'kn'
  | 'kn-IN'
  | 'kk'
  | 'kk-Cyrl'
  | 'kk-Cyrl-KZ'
  | 'km'
  | 'km-KH'
  | 'ki'
  | 'ki-KE'
  | 'rw'
  | 'rw-RW'
  | 'kok'
  | 'kok-IN'
  | 'ko'
  | 'ko-KR'
  | 'khq'
  | 'khq-ML'
  | 'ses'
  | 'ses-ML'
  | 'nmg'
  | 'nmg-CM'
  | 'lag'
  | 'lag-TZ'
  | 'lv'
  | 'lv-LV'
  | 'ln'
  | 'ln-CG'
  | 'ln-CD'
  | 'lt'
  | 'lt-LT'
  | 'lu'
  | 'lu-CD'
  | 'luo'
  | 'luo-KE'
  | 'luy'
  | 'luy-KE'
  | 'mk'
  | 'mk-MK'
  | 'jmc'
  | 'jmc-TZ'
  | 'mgh'
  | 'mgh-MZ'
  | 'kde'
  | 'kde-TZ'
  | 'mg'
  | 'mg-MG'
  | 'ms'
  | 'ms-BN'
  | 'ms-MY'
  | 'ml'
  | 'ml-IN'
  | 'mt'
  | 'mt-MT'
  | 'gv'
  | 'gv-GB'
  | 'mr'
  | 'mr-IN'
  | 'mas'
  | 'mas-KE'
  | 'mas-TZ'
  | 'mer'
  | 'mer-KE'
  | 'mfe'
  | 'mfe-MU'
  | 'mua'
  | 'mua-CM'
  | 'naq'
  | 'naq-NA'
  | 'ne'
  | 'ne-IN'
  | 'ne-NP'
  | 'nd'
  | 'nd-ZW'
  | 'nb'
  | 'nb-NO'
  | 'nn'
  | 'nn-NO'
  | 'nus'
  | 'nus-SD'
  | 'nyn'
  | 'nyn-UG'
  | 'or'
  | 'or-IN'
  | 'om'
  | 'om-ET'
  | 'om-KE'
  | 'ps'
  | 'ps-AF'
  | 'fa'
  | 'fa-AF'
  | 'fa-IR'
  | 'pl'
  | 'pl-PL'
  | 'pt'
  | 'pt-AO'
  | 'pt-BR'
  | 'pt-GW'
  | 'pt-MZ'
  | 'pt-PT'
  | 'pt-ST'
  | 'pa'
  | 'pa-Arab'
  | 'pa-Arab-PK'
  | 'pa-Guru'
  | 'pa-Guru-IN'
  | 'ro'
  | 'ro-MD'
  | 'ro-RO'
  | 'rm'
  | 'rm-CH'
  | 'rof'
  | 'rof-TZ'
  | 'rn'
  | 'rn-BI'
  | 'ru'
  | 'ru-MD'
  | 'ru-RU'
  | 'ru-UA'
  | 'rwk'
  | 'rwk-TZ'
  | 'saq'
  | 'saq-KE'
  | 'sg'
  | 'sg-CF'
  | 'sbp'
  | 'sbp-TZ'
  | 'seh'
  | 'seh-MZ'
  | 'sr'
  | 'sr-Cyrl'
  | 'sr-Cyrl-BA'
  | 'sr-Cyrl-ME'
  | 'sr-Cyrl-RS'
  | 'sr-Latn'
  | 'sr-Latn-BA'
  | 'sr-Latn-ME'
  | 'sr-Latn-RS'
  | 'ksb'
  | 'ksb-TZ'
  | 'sn'
  | 'sn-ZW'
  | 'ii'
  | 'ii-CN'
  | 'si'
  | 'si-LK'
  | 'sk'
  | 'sk-SK'
  | 'sl'
  | 'sl-SI'
  | 'xog'
  | 'xog-UG'
  | 'so'
  | 'so-DJ'
  | 'so-ET'
  | 'so-KE'
  | 'so-SO'
  | 'es'
  | 'es-AR'
  | 'es-BO'
  | 'es-CL'
  | 'es-CO'
  | 'es-CR'
  | 'es-DO'
  | 'es-EC'
  | 'es-SV'
  | 'es-GQ'
  | 'es-GT'
  | 'es-HN'
  | 'es-419'
  | 'es-MX'
  | 'es-NI'
  | 'es-PA'
  | 'es-PY'
  | 'es-PE'
  | 'es-PR'
  | 'es-ES'
  | 'es-US'
  | 'es-UY'
  | 'es-VE'
  | 'sw'
  | 'sw-KE'
  | 'sw-TZ'
  | 'sv'
  | 'sv-FI'
  | 'sv-SE'
  | 'gsw'
  | 'gsw-CH'
  | 'shi'
  | 'shi-Latn'
  | 'shi-Latn-MA'
  | 'shi-Tfng'
  | 'shi-Tfng-MA'
  | 'dav'
  | 'dav-KE'
  | 'ta'
  | 'ta-IN'
  | 'ta-LK'
  | 'twq'
  | 'twq-NE'
  | 'te'
  | 'te-IN'
  | 'teo'
  | 'teo-KE'
  | 'teo-UG'
  | 'th'
  | 'th-TH'
  | 'bo'
  | 'bo-CN'
  | 'bo-IN'
  | 'ti'
  | 'ti-ER'
  | 'ti-ET'
  | 'to'
  | 'to-TO'
  | 'tr'
  | 'tr-TR'
  | 'uk'
  | 'uk-UA'
  | 'ur'
  | 'ur-IN'
  | 'ur-PK'
  | 'uz'
  | 'uz-Arab'
  | 'uz-Arab-AF'
  | 'uz-Cyrl'
  | 'uz-Cyrl-UZ'
  | 'uz-Latn'
  | 'uz-Latn-UZ'
  | 'vai'
  | 'vai-Latn'
  | 'vai-Latn-LR'
  | 'vai-Vaii'
  | 'vai-Vaii-LR'
  | 'vi'
  | 'vi-VN'
  | 'vun'
  | 'vun-TZ'
  | 'cy'
  | 'cy-GB'
  | 'yav'
  | 'yav-CM'
  | 'yo'
  | 'yo-NG'
  | 'dje'
  | 'dje-NE'
  | 'zu'
  | 'zu-ZA';

export type StrapiContentType = {
  id: string;
  singularName: string;
  path: string;
};

export type StrapiContentTypeInput = string | StrapiContentType;

export type StrapiClientOptions = {
  url?: string;
  prefix?: string;
  contentTypes: StrapiContentTypeInput[];
  jwt?: string | null;
  requestInit?: RequestInit;
  maxRequestsPerSecond?: number;
  debug?: boolean;
};

export type StrapiUser = Record<string, unknown> | null;

export type StrapiError = {
  data: null;
  error: {
    status: number;
    name: string;
    message: string;
    details: Record<string, unknown>;
  };
};

export type StrapiAuthenticationData = {
  identifier: string;
  password: string;
};

export type StrapiRegistrationData = {
  username: string;
  email: string;
  password: string;
};

export type StrapiForgotPasswordData = {
  email: string;
};

export type StrapiResetPasswordData = {
  code: string;
  password: string;
  passwordConfirmation: string;
};

export type StrapiEmailConfirmationData = {
  email: string;
};
