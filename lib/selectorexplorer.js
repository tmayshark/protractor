/**
 * EXPERIMENTAL!!!
 *
 * Usage:
 * Expects a selenium standalone server to be running at localhost:4444
 * from protractor directory, run with:
 *     node lib/selectorexplorer.js <urL>
 * This will load up the URL on webdriver and put the terminal into a REPL
 * loop.
 * You will see a > prompt. The `ptor` and `protractor` variables will
 * be available. Enter a command such as:
 * > ptor.findElement(protractor.by.id('foobar')).getText()
 * or
 * > ptor.get('http://www.angularjs.org')
 * try just
 * > ptor
 * to get a list of functions you can call.
 */

var webdriver = require('selenium-webdriver');
var protractor = require('./protractor.js');
var repl = require('repl');
var util = require('util');

var driver, ptor;

var myEval = function(cmd, context, filename, callback) {
  var flow = webdriver.promise.controlFlow();
  flow.execute(function() {
    try {
      return eval(cmd);
    } catch (e) {
      // Catch syntax errors in the 'eval'.
      util.puts('Eval error: ' + e.message);
      callback(null, undefined);
    }
  }).then(function(result) {
    callback(null, result);
  }, function(err) {
    callback(null, 'There was a webdriver error: ' + err);
  });
}

var startRepl = function() {
  repl.start({
    'useGlobal': true,
    'eval': myEval
  }).on('exit', function() {
    // shut down;
    driver.quit();
    util.puts('Shutting down. Goodbye.');
  });
};

var startUp = function() {
  driver = new webdriver.Builder().
    usingServer('http://localhost:4444/wd/hub').
    withCapabilities({'browserName': 'chrome'}).build();

  driver.getSession().then(function(session) {
    driver.manage().timeouts().setScriptTimeout(11000);

    ptor = protractor.wrapDriver(driver);

    var url = process.argv[2];
    util.puts('Getting page at: ' + url);
    driver.get(url);

    startRepl();
  });
};


startUp();
