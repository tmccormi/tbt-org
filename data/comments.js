const path = require("path");

function parseList(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  return String(value)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

const defaultConfigPath = path.join(__dirname, "../functions/moderators.json");
// eslint-disable-next-line global-require, import/no-dynamic-require
const { emails: defaultModerators = [] } = require(defaultConfigPath);

const envModerators = parseList(
  process.env.ALLOWED_MODERATORS || process.env.COMMENTS_ALLOWED_MODERATORS
);

const allowedModerators = envModerators.length ? envModerators : defaultModerators;

module.exports = {
  allowedModerators,
};
