const { DateTime } = require("luxon");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "assets": "assets" });

  eleventyConfig.addCollection("blog", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("pages/blog/posts/*.md")
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addFilter("readableDate", (value, format = "MMMM d, yyyy") => {
    if (value === "now") {
      return DateTime.now().toFormat(format);
    }

    if (value instanceof Date) {
      return DateTime.fromJSDate(value, { zone: "utc" }).toFormat(format);
    }

    if (typeof value === "string") {
      return DateTime.fromISO(value, { zone: "utc" }).toFormat(format);
    }

    return DateTime.fromJSDate(new Date(value), { zone: "utc" }).toFormat(format);
  });

  return {
    dir: {
      input: "pages",
      includes: "../layouts",
      data: "../data",
      output: "docs"
    },
    templateFormats: ["njk", "md", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};
