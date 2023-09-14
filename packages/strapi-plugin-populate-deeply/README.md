# Strapi plugin populate-deeply

This plugin allows for easier population of deep content structures using the rest API. It is heavily based on the populate-deep plugin but I have rewritten in Typescript and fixed a number of bugs and security issues.

# Installation

`npm install strapi-plugin-populate-deeply`

`yarn add strapi-plugin-populate-deeply`

# Usages

## Examples

Populate a request with the default depth.

`/api/articles?populate=deep`

Populate a request with the a custom depth

`/api/articles?populate=deep,10`

## Good to know

To guard against DoS attacks, a maximum depth can be configured, defaulting to 5 levels deep.

The populate deep option is available for all collections and single types using the findOne and findMany methods.

# Configuration

The default and max depths can be customized via the plugin config. To do so create or edit you plugins.js file.

## Example configuration

`config/plugins.js`

```
module.exports = ({ env }) => ({
  'strapi-plugin-populate-deep': {
    config: {
      defaultDepth: 4, // Default is 3
      maxDepth: 6, // Default is 5
    }
  },
});
```

# Contributions

The original idea for getting the populate structure was created by [tomnovotny7](https://github.com/tomnovotny7) and can be found in [this](https://github.com/strapi/strapi/issues/11836) github thread. The plugin is entirely based on the [populate-deep](https://github.com/Barelydead/strapi-plugin-populate-deep) plugin by Christofer Jungberg.
