var util = require('util');
var path = require('path')
var fs = require('fs');
var runner = require('./runner.js');
var glob = require('glob');
var readline = require('readline');

/**
 * The command line interface for interacting with the Protractor runner.
 * It takes care of parsing the config file and command line options.
 */

var args = process.argv.slice(2);
var configPath;
var stayOpen;


var printVersion = function () {
  util.puts('Version ' + JSON.parse(
      fs.readFileSync(__dirname + '/../package.json', 'utf8')).version);
  process.exit(0);
};


if (!args.length) {
  util.puts('USAGE: protractor [configFile] [options]');
  util.puts('Options:');
  util.puts('  --version: Print Protractor version');
  util.puts('  --browser <string>: Browsername, e.g. chrome or firefox');
  util.puts('  --seleniumAddress <string>: A running selenium address to use');
  util.puts('  --seleniumServerJar <string>: Location of the standalone selenium server .jar file');
  util.puts('  --seleniumPort <string>: Optional port for the standalone selenium server');
  util.puts('  --baseUrl <string>: URL to prepend to all relative paths');
  util.puts('  --rootElement <string>: Element housing ng-app, if not html or body');
  util.puts('  --specs <list>: Comma separated list of files to test');
  util.puts('  --[no]includeStackTrace: Print stack trace on error');
  util.puts('  --verbose: Print full spec names');

  process.exit(0);
}

var commandLineConfig = { capabilities: {}, jasmineNodeOpts: {}};

while(args.length) {
  var arg = args.shift();
  switch(arg) {
    case '--version':
      printVersion();
      break;
    case '--browser':
      commandLineConfig.capabilities.browserName = args.shift();
      break;
    case '--seleniumAddress':
      commandLineConfig.seleniumAddress = args.shift();
      break;
    case '--seleniumServerJar':
      commandLineConfig.seleniumServerJar = args.shift();
      break;
    case '--seleniumPort':
      commandLineConfig.seleniumPort = args.shift();
      break;
    case '--sauceUser':
      commandLineConfig.sauceUser = args.shift();
      break;
    case '--sauceKey':
      commandLineConfig.sauceKey = args.shift();
      break;
    case '--baseUrl':
      commandLineConfig.baseUrl = args.shift();
      break;
    case '--rootElement':
      commandLineConfig.rootElement = args.shift();
      break;
    case '--specs':
      commandLineSpecs = args.shift().split(',');
      commandLineSpecs.forEach(function(spec, index, arr) {
        arr[index] = path.resolve(process.cwd(), spec);
      });
      commandLineConfig.specs = commandLineSpecs;
      break;
    case '--includeStackTrace':
      commandLineConfig.jasmineNodeOpts.includeStackTrace = true;
      break;
    case '--noincludeStackTrace':
      commandLineConfig.jasmineNodeOpts.includeStackTrace = false;
      break;
    case '--verbose':
      commandLineConfig.jasmineNodeOpts.isVerbose = true;
      break;
    case '--stayopen':
      stayOpen = true;
      break;
    default:
      configPath = path.resolve(process.cwd(), arg);
      break;
  }
}

var config = {};

if (configPath) {
  runner.merge(config, require(configPath).config);
  config.specFileBase = path.dirname(configPath);
}

runner.merge(config, commandLineConfig);

if (!stayOpen) {
  runner.setup(config).then(function() {
    runner.run().then(function() {
      runner.teardown();
    });
  });
} else {
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  runner.setup(config).then(function() {
    function loop() {
      rl.question('Press enter to run tests, or enter q to quit: ',
          function(answer) {
        if (answer === 'q') {
          runner.teardown();
        } else {
          runner.run().then(loop);
        }
      });
    };

    loop();
  });
}
