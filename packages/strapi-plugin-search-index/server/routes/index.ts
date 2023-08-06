export default {
  routes: [
    {
      method: 'POST',
      path: '/search-index/rebuild',
      handler: 'search-index.rebuild',
    },
  ],
};
