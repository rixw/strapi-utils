export default {
  type: 'content-api',
  routes: [
    {
      method: 'POST',
      path: '/',
      handler: 'plugin::search-index.search-index.rebuild',
    },
  ],
};
