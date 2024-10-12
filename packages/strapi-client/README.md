# Strapi Client

This is a generic REST API client for [Strapi](https://strapi.io/) v4. It is
being created with a couple of objectives:

- Simplify the process of calling Strapi APIs from the frontend
- Unwrap Strapi's complicated data structure and return a simple object or array
  of objects
- Typing support Strapi's API parameters

## Roadmap

- [x] Basic fetch operations
- [x] Automatic API parameter stringification
- [x] Normalisation of Strapi's complex data structure
- [x] Support for Strapi's Users & Permissions plugin
- [x] Support for Strapi's API Tokens
- [x] Create, update and delete operations
- [x] Support for Strapi's internationalisation
- [x] Custom error types
- [x] Simplified API support for pagination
- [x] Optional date conversion (currently forced)
- [x] Built-in rate limiting
- [ ] Simplified support for uploaded files
- [ ] Improved API for specifying content types (use `ts:generate-types`)

## Compatibility

This library is compatible with Strapi v4. It has been tested with Strapi v4.9
but should be backwards compatible to any v4 version.

Strapi v5 enables a simplified REST response, so the unwrapping in this
library will not be necessary. I have not tested this library with Strapi v5.

Because of the different REST API response formats in Strapi v3 and v4, this
library is not compatible with Strapi v3.

HTTP requests use [Axios](https://axios-http.com/) so can work on both client
and server side.

## Kudos to `strapi-sdk-js`

Credit should go to [strapi-sdk-js](https://strapi-sdk-js.netlify.app/). I
started this client library before I realised this exists (although at time of
writing there have been no updates since February 2022). I've taken some
ideas from this library, although I've tried to improve the typing of API
parameters and simplify the API around unwrapping Strapi's standard data
responses.

## Installation

Using npm:

```
$ npm install @rixw/strapi-client
```

Using yarn:

```
$ yarn add @rixw/strapi-client
```

Using pnpm:

```
$ pnpm add @rixw/strapi-client
```

## Basic usage

```typescript
import { StrapiClient } from '@rixw/strapi-client';
import { Page } from './types'; // Your own type definitions

// Instantiate the client
const client = new StrapiClient({
  baseURL: 'https://example.com/api', // Required root of the REST API
  contentTypes: ['page', 'post'], // Singular names of entities
});

// Login - sets the JWT token in the client if using Users & Permissions plugin
const jwt = await client.login('example@example.com', 'password');

// Retrieve a list of items
const pages = await client.fetchMany<Page>('page', {
  sort: 'title:asc',
  populate: '*',
});

// Retrieve a single item
const page = await client.fetchById<Page>('page', 1);
```

## API

### `StrapiClient`

#### `constructor`

```typescript
{
  // The root of the Strapi REST API.
  baseURL: 'https://example.com/api',

  // An array of the content types in your API. This is used to map the UID of
  // the type to singular and plural names for building the API URLs.
  // Can be either simple singular names, in which case the UID is assumed to be
  // `api::entity.entity` and the path `/api/entities`. For other entries
  // including single types or plugin entities, use a longer-form object
  // definition.
  contentTypes: [
    'page',
    'post',
    {
      id: 'api::homepage.homepage',
      singularName: 'homepage',
      path: '/api/homepage',
    },
    {
      id: 'plugin::my-plugin.my-content-type',
      singularName: 'my-content-type',
      path: '/api/my-plugin/my-content-types',
    },
  ],

  // A JWT token to use for authentication. You can provide either Strapi's
  // long-lived API Tokens or, if you've cached a short-term JWT token from the
  // Users & Permissions plugin, you can provide that instead. Optional - if
  // not provided no Authorization header will be sent.
  jwt: 'xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',

  // An Axios config object to use for all requests. Optional. Allows overriding
  // the default timeout, headers, etc. You could provide an HttpAgent to
  // implement rate limiting, for example.
  // See https://github.com/axios/axios#request-config for more details.
  // Note that headers set by the client (Authorization, Accept, Content-Type)
  // will override any headers you provide here.
  axiosConfig?: {
    timeout: 1000,
    maxRedirects: 5,
    httpAgent: new http.Agent({ keepAlive: true }),
    httpsAgent: new https.Agent({ keepAlive: true }),
    proxy: {
      protocol: 'https',
      host: '127.0.0.1',
      port: 9000,
      auth: {
        username: 'proxyuser',
        password: 'proxypassword'
      },
    },
  },

  // If true, the client will log debug information to the console.
  // Default: false.
  debug: true,
}
```

#### `login => Promise<string>`

`identifier` (`string`) - the identifier to use for login (e.g. email address)

`password` (`string`) - the password to use for login

```typescript
const jwt = await client.login({
  identifier: 'example@example.com',
  password: 'password',
});
```

Convenience method to login to the Users & Permissions plugin. Makes a POST
request to `${baseURL}/auth/local` with the provided credentials and sets the
JWT token in the client. Returns the JWT token.

#### `fetchById<T extends StrapiEntity> => Promise<T>`

`uid` (`string`) - the content type UID

`id` (`number`) - the ID of the entity to fetch

`params` (`StrapiParams`) - optional parameters to pass to the API

```typescript
const page = await client.fetchById<Page>('page', 1);
```

Makes a GET request for the specified entity. Uses the contentTypes array to
work out the URL. Provided `params` are passed to the API after conversion with
the [qs](https://github.com/ljharb/qs) library as described in the
[Strapi docs](https://docs.strapi.io/dev-docs/api/rest/parameters). Enables you
to specify `populate`, `fields`, `filters` etc without boilerplate. If you're
using Typescript, this object is typed.

The response is unwrapped from Strapi's complicated data structure and returned
as a simple object.

#### `fetchMany<T extends StrapiEntity> => Promise<StrapiPaginatedArray<T>>`

```typescript
const pages = await client.fetchMany<Page>('page', {
  sort: 'title:asc',
  populate: '*',
});
```

Makes a GET request for the specified entities. Uses the contentTypes array to
work out the URL. Provided `params` are passed to the API after conversion with
the [qs](https://github.com/ljharb/qs) library as described in the
[Strapi docs](https://docs.strapi.io/dev-docs/api/rest/parameters). Enables you
to specify `populate`, `fields`, `filters` etc without boilerplate. If you're
using Typescript, this object is typed.

The response is unwrapped from Strapi's complicated data structure and returned
as a `StrapiPaginatedArray<T>`, which is essentially a plain array of entities
with an additional `pagination` property.

#### `fetchSingle<T extends StrapiEntity> => Promise<T>`

```typescript
const pages = await client.fetchSingle<Page>('homepage', {
  populate: '*',
});
```

Makes a GET request for the specified single entity. Uses the contentTypes array to
work out the URL. Provided `params` are passed to the API after conversion with
the [qs](https://github.com/ljharb/qs) library as described in the
[Strapi docs](https://docs.strapi.io/dev-docs/api/rest/parameters). Enables you
to specify `populate`, `fields`, `filters` etc without boilerplate. If you're
using Typescript, this object is typed.

The response is unwrapped from Strapi's complicated data structure and returned
as a simple object..

## Normalisation

Strapi responses are unwrapped from Strapi's complicated data structure using a
recursive function that extracts all `data` properties and merges the `id` and
`attributes` of entities so that they are flat. This means that you can use
returned entities in a more intuitive way, e.g. `page.title` instead of
`page.data.attributes.title`.

Any properties whose name ends `At` or `On` and whose value is an ISO Date
string are converted to `Date` objects.

### Example array response normalisation:

Strapi response:

```json
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "title": "Root",
        "slug": "root",
        "createdAt": "2023-04-09T11:26:45.039Z",
        "updatedAt": "2023-04-09T11:26:49.426Z",
        "publishedAt": "2023-04-09T11:26:49.419Z",
        "child_pages": {
          "data": [
            {
              "id": 2,
              "attributes": {
                "title": "Node",
                "slug": "node",
                "createdAt": "2023-04-09T11:27:20.374Z",
                "updatedAt": "2023-04-09T11:27:26.629Z",
                "publishedAt": "2023-04-09T11:27:26.607Z"
              }
            }
          ]
        },
        "parent_page": {
          "data": null
        }
      }
    },
    {
      "id": 2,
      "attributes": {
        "title": "Node",
        "slug": "node",
        "createdAt": "2023-04-09T11:27:20.374Z",
        "updatedAt": "2023-04-09T11:27:26.629Z",
        "publishedAt": "2023-04-09T11:27:26.607Z",
        "child_pages": {
          "data": []
        },
        "parent_page": {
          "data": {
            "id": 1,
            "attributes": {
              "title": "Root",
              "slug": "root",
              "createdAt": "2023-04-09T11:26:45.039Z",
              "updatedAt": "2023-04-09T11:26:49.426Z",
              "publishedAt": "2023-04-09T11:26:49.419Z"
            }
          }
        }
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 2
    }
  }
}
```

becomes:

```javascript
[
  {
    id: 1,
    title: 'Root',
    slug: 'root',
    createdAt: new Date('2023-04-09T11:26:45.039Z'),
    updatedAt: new Date('2023-04-09T11:26:49.426Z'),
    publishedAt: new Date('2023-04-09T11:26:49.419Z'),
    child_pages: [
      {
        id: 2,
        title: 'Node',
        slug: 'node',
        createdAt: new Date('2023-04-09T11:27:20.374Z'),
        updatedAt: new Date('2023-04-09T11:27:26.629Z'),
        publishedAt: new Date('2023-04-09T11:27:26.607Z'),
      },
    ],
    parent_page: null,
  },
  {
    id: 2,
    title: 'Node',
    slug: 'node',
    createdAt: new Date('2023-04-09T11:27:20.374Z'),
    updatedAt: new Date('2023-04-09T11:27:26.629Z'),
    publishedAt: new Date('2023-04-09T11:27:26.607Z'),
    child_pages: [],
    parent_page: {
      id: 1,
      title: 'Root',
      slug: 'root',
      createdAt: new Date('2023-04-09T11:26:45.039Z'),
      updatedAt: new Date('2023-04-09T11:26:49.426Z'),
      publishedAt: new Date('2023-04-09T11:26:49.419Z'),
    },
  },
];
```

The array also has a property `pagination` which contains the pagination
(acessible as `myArray.pagination`):

```javascript
pagination: {
  page: 1,
  pageSize: 25,
  pageCount: 1,
  total: 2
}
```

### Example single entity normalisation:

Strapi response:

```json
{
  "data": {
    "id": 1,
    "attributes": {
      "title": "Root",
      "slug": "root",
      "createdAt": "2023-04-09T11:26:45.039Z",
      "updatedAt": "2023-04-09T11:26:49.426Z",
      "publishedAt": "2023-04-09T11:26:49.419Z",
      "child_pages": {
        "data": [
          {
            "id": 2,
            "attributes": {
              "title": "Node",
              "slug": "node",
              "createdAt": "2023-04-09T11:27:20.374Z",
              "updatedAt": "2023-04-09T11:27:26.629Z",
              "publishedAt": "2023-04-09T11:27:26.607Z"
            }
          }
        ]
      },
      "parent_page": {
        "data": null
      }
    }
  }
}
```

becomes:

```javascript
{
  id: 1,
  title: "Root",
  slug: "root",
  createdAt: new Date("2023-04-09T11:26:45.039Z"),
  updatedAt: new Date("2023-04-09T11:26:49.426Z"),
  publishedAt: new Date("2023-04-09T11:26:49.419Z"),
  child_pages: [
    {
      id: 2,
      title: "Node",
      slug: "node",
      createdAt: new Date("2023-04-09T11:27:20.374Z"),
      updatedAt: new Date("2023-04-09T11:27:26.629Z"),
      publishedAt: new Date("2023-04-09T11:27:26.607Z")
    }
  ],
  parent_page: null
}
```

## Entity Types

If using Typescript, the `fetchMany` and `fetchById` methods are generic and
take a type parameter which allows you to specify the type of the entity you
are querying. There is a very simple interface defined for entities with just
the basic Strapi entity fields:

```typescript
interface StrapiEntity {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  publishedAt?: Date;
}
```
