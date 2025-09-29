module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({
    "assets": "assets",
  });

  return {
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      output: "docs",
    },
  };
};
