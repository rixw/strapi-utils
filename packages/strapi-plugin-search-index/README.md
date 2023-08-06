# Strapi Search Index plugin

- Index your Strapi content-types into Algolia, Elasticsearch, or other search index providers
- Select fields for each Strapi content-type to include or omit
- Specify custom transformations for each included field
- Perform full (re-)indexing operations, in addition to incremental updates

This is a Typescript rewrite and enhancement of Mattie Belt's original [strapi-plugin-search](https://mattie-bundle.mattiebelt.com/) plugin. I created it to enhance the functionality provided, and in the process rewrote the plugin to use [TypeScript](https://www.typescriptlang.org/).

See also the [strapi-provider-search-index-algolia](https://github.com/rixw/strapi-utils).

## Documentation

[Mattie's original documentation](https://mattie-bundle.mattiebelt.com/) is excellent and this plugin works the same way. There are some enhancements in this version though.

Assuming you already have a Strapi application to install into (if not, [see Strapi's docs](https://strapi.io/documentation/developer-docs/latest/setup-deployment-guides/installation/cli.html)), first install the plugin:

```sh
# install with npm
npm install strapi-plugin-search-index
# or yarn
yarn add strapi-plugin-search-index
```

You will also need a provider for your search engine. There's a pre-built provider for Algolia, or you can write your own. See the [strapi-provider-search-index-algolia](https://github.com/rixw/strapi-utils/tree/main/packages/strapi-provider-search-index-algolia) package for an example of how to write your own provider.

```sh
# install with npm
npm install strapi-provider-search-index-algolia
# or yarn
yarn add strapi-provider-search-index-algolia
```

Then configure the plugin in your Strapi application:

```typescript
// ./config/plugins.js
'search-index': {
  enabled: true,
  config: {
    provider: 'algolia', // or your custom search provider
    resolve: './path/to/your/search-provider', // only if using a local provider
    debug: env('NODE_ENV') === 'production',
    providerOptions: {
      apiKey: env('ALGOLIA_PROVIDER_ADMIN_API_KEY'),
      applicationId: env('ALGOLIA_PROVIDER_APPLICATION_ID'),
    },
    enableReindexEndpoint: true
    contentTypes: [ // An array of content-types to index
      {
        name: 'api::page.page', // The fully qualified Strapi content-type name
        index: `my_index_${env('process.env.NODE_ENV')}`,
        idPrefix: 'page', // Optional prefix for the ID of each item in the index
        fields: ['id', 'title', 'page_header', 'content'], // Defined list of fields, or...
        excludedFields: ['created_at','updated_at','exclude_me'], // ...a list of excluded fields
        transforms: {
          page_header: (header: PageHeader) => {
            return `${header.formatted_title}\n\n${header.standfirst}`.trim();
          },
          content: (content: any[]) => {
            return content
              .map((item) => {
                if (item.__component === 'content.body')
                  return `${(item as Body).body}`.trim();
                if (item.__component === 'content.blockquote')
                  return `${(item as Blockquote).quote}\n${
                    (item as Blockquote).attribution
                  }`.trim();
                if (item.__component === 'content.image-gallery')
                  return `${(item as ImageGallery).heading} ${
                    (item as ImageGallery).caption
                  }`.trim();
                return undefined;
              })
              .filter((item) => !!item)
              .join('\n\n');
          },
        },
      },
    ],
  },
},

```

| Property                    | Type                               | Default     | Notes                                                                                                                                                                                               |
| --------------------------- | ---------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| provider                    | `string`                           | `'algolia'` | Required. You can specify a full NPM package name (which may be a local package), or for convenience omit the leading `strapi-provider-search-index-`                                               |
| resolve                     | `string`                           |             | Used to specify a path to the root of a local package; not needed for NPM packages.                                                                                                                 |
| debug                       | `boolean`                          | `false`     | Whether to output detailed indexing logging.                                                                                                                                                        |
| providerOptions             | `object`                           | `null`      | Provider-specific configuration, passed to the provider as-is.                                                                                                                                      |
| contentTypes                | `Array<object>`                    | []          | An array of content-types to index.                                                                                                                                                                 |
| enableRebuildEndpoint       | `boolean`                          | false       | Global flag to allow or deny use of the `/search-index/rebuild` endpoint.                                                                                                                           |
| contentTypes.name           | `string`                           |             | The fully-qualified Strapi content-type ID                                                                                                                                                          |
| contentTypes.index          | `string`                           |             | The name of the index to push this to                                                                                                                                                               |
| contentTypes.idPrefix       | `string`                           | `null`      | An optional string to prepend to entity IDs. Useful if pushing multiple content types to the same index, to avoid ID collisions.                                                                    |
| contentTypes.fields         | `Array<string>`                    | All fields  | A list of fields to include in the index data. Uses Lodash's `pick` function internally, so paths can use dot notation to include only specific fields of components, eg `parent.child.grandchild`. |
| contentTypes.excludedFields | `Array<string>`                    |             | A list of fields to exclude from the index data. Any fields not specified are indexed. Ignored if `fields` is specified.                                                                            |
| contentTypes.transforms     | `{ [string]: (item: any) => any }` |             | An object whose keys should match fields in the content-type, and whose values are functions to modify the data structure before sending to the index.                                              |

## Transforms

Although the ability to use dot notation when specifying fields allows control over the shape of the data going to your index, Transforms allow you to re-shape your data more flexibly. This is useful for transforming nested components (including dynamic zones), and where you are including data that will be used by the index to search against, but not then displayed in the results (such as when indexing a full article body).

The `transforms` object consists of keys that should match the field being transformed. Values are a function, whose single parameter is the raw value of the field and which should return a new value to be indexed instead.

```typescript
{
  [string]: (item: any) => any
}
```

The example above shows how a dynamic zone of multiple content blocks can be manipulated into a single string containing only the relevant text for indexing. We can remove all of the other fields that may be on each component, since they are not relevant for searching and the search results that come back from the search engine won't be displaying them.

## Rebuilding indexes

Once the plugin is registered with Strapi, it is accessible from the `strapi` global. The plugin's services includes a `provider` property that exposes a `rebuild` function. This function allows you to specify rebuilding of indexes. There are several use-cases for this:

- Adding a content-type with pre-existing data to a search index
- Content type data may have changed without the lifecycle events that this plugin listens to being fired, for example when making bulk changes to the data in the database, rather than through the Admin panel.

Rebuilding works like this:

1. Completely empties the configured indexes for the content-types specified by calling the Provider's `clear` function.
2. Retrieves and iterates over every entity in the database for the content-types specified and pushes it to the index by calling the Provider's `createMany` function.
3. Checks whether any other content-types are configured to use the same index(es) as those specified and also pushes them through `createMany`.

**A word of caution**: internally the plugin performs `findMany` on not only your specified content type, but also any other content types configured to use the same index. This can lead your rebuilding task to be bigger, more time consuming and resource intensive than you realise. And, of course, between calling `clear` and the completion of `createMany` your index will only include partial data. _If `clear` works, but retrieving the full data set from the database errors (such as an out-of-memory error) or you restart your server you could end up with an empty or partial search index!_

### Rebuild API endpoints

The plugin creates a `search-index` controller with a `rebuild` endpoint. This is a `POST` endpoint that expects a simple JSON input:

```jsonc
// POST ./search-index/rebuild
{
  "contentTypes": ["type", "another-type"]
}
```

The endpoint acknowledges that rebuilding has begun; the actual rebuild job is performed asynchronously.

This endpoint is enabled by setting `enableReindexEndpoint` true in your config - by default, the endpoint is turned off and returns a 403 error. If enabled, you can control access to this endpoint using Strapi's Users & Permissions access control.

### Programmatic rebuilds

You can initiate a rebuild in your own code by calling the `rebuild` function directly. This function accepts an array of content-type IDs to rebuild. If you don't specify any content-types, it will rebuild all content-types that are configured in `config/plugins.[ts|js]`.

```typescript
strapi.plugins['search-index'].services['provider'].rebuild([
  'api::type.type',
  'api::another.another',
]);
```
