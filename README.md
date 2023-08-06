# Strapi Utils

This is a collection of utilities that I've created to make my lifes easier in working with [Strapi](https://strapi.io).

### Packages

- `strapi-client`: a generic API client for Strapi
- `strapi-plugin-search-index`: an updated and improved version of [Mattie Belt's plugin](https://github.com/MattieBelt/mattie-strapi-bundle)
- `strapi-provider-search-index-algolia`: an updated and improved version of [Mattie Belt's provider](https://github.com/MattieBelt/mattie-strapi-bundle)

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/). This is a turborepo monorepo using [Yarn](https://classic.yarnpkg.com/) as a package manager.

## Development

### Pre-requisites

- [Node.js](https://nodejs.org/en/) (v18.0.0 or higher)
- [Yarn](https://yarnpkg.com/) (v1.22.0 or higher)

### Setup

```sh
// install dependencies
yarn

// lint
yarn lint

// build all packages
yarn build

// run tests
yarn test
```

## Licence

See the MIT License file for licensing information.
