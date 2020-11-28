var log4js = require("log4js");

log4js.configure({
  appenders: { file: { type: "file", filename: "test_results.log" } },
  categories: { default: { appenders: ["file"], level: "info" } },
});

module.exports = log4js;
