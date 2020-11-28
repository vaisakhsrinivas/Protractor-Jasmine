require("babel-register")({
  presets: [ 'es2015' ]
});

// An example configuration file.
exports.config = {
  directConnect: true,

  // Capabilities to be passed to the webdriver instance.
  capabilities: {
    'browserName': 'chrome'
  },

  // Framework to use. Jasmine is recommended.
  framework: 'jasmine',

  // Spec patterns are relative to the current working directory when
  // protractor is callsled.
  specs: ['../specs/*.js'],

  // Options to be passed to Jasmine.
  jasmineNodeOpts: {
    defaultTimeoutInterval: 60000
  },

  //protractor-beautiful-reporter
  onPrepare: function() {
    var HtmlReporter = require('protractor-beautiful-reporter');
    jasmine.getEnv().addReporter(new HtmlReporter({
       baseDirectory: './reports'
       , disableScreenshots: true
    }).getJasmine2Reporter());
 }

};
