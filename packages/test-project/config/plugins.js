module.exports = ({ env }) => ({
  "search-index": {
    enabled: true,
    config: {
      provider: "algolia",
      debug: process.env.NODE_ENV === "production",
      providerOptions: {
        apiKey: env("ALGOLIA_PROVIDER_ADMIN_API_KEY"),
        applicationId: env("ALGOLIA_PROVIDER_APPLICATION_ID"),
      },
      contentTypes: [
        {
          name: "api::post.post",
          index: `strapi_provider_search_index_test`,
        },
      ],
    },
  },
});
