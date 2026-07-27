module.exports = ({ config }) => {
  const pagesBaseUrl = process.env.GITHUB_PAGES_BASE_URL?.trim();

  return {
    ...config,
    experiments: {
      ...config.experiments,
      ...(pagesBaseUrl ? { baseUrl: pagesBaseUrl } : {}),
    },
  };
};
