import { PopulateObject, getFullPopulateObject } from './helpers';

const bootstrap = ({ strapi }) => {
  const defaultDepth =
    strapi.plugin('strapi-plugin-populate-deep')?.config('defaultDepth') || 3;
  const maxDepth =
    strapi.plugin('strapi-plugin-populate-deep')?.config('maxDepth') || 5;
  // Subscribe to the lifecycles that we are interested in.
  strapi.db.lifecycles.subscribe((event) => {
    if (event.action === 'beforeFindMany' || event.action === 'beforeFindOne') {
      let populate = event.params?.populate;
      if (typeof populate === 'string') {
        populate = [populate];
      }
      if (populate && populate[0] === 'deep') {
        const depth = populate[1] ?? defaultDepth;
        const modelObject = getFullPopulateObject(
          event.model.uid,
          depth > maxDepth ? maxDepth : depth,
          []
        );
        event.params.populate = (modelObject as PopulateObject).populate;
      }
    }
  });
};

export default bootstrap;
