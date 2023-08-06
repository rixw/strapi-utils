export default {
  type: 'content-api',
  routes: [
    {
      method: 'POST',
      path: '/search-index/rebuild',
      handler: 'search-index.rebuild',
    },
  ],
};
