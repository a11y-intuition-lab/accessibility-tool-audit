var fs = require('fs'),
    path = require('path'),
    _ = require('lodash');


var paths = {
  testsJson: path.join(__dirname, '../tests.json'),
  analysisJson: path.join(__dirname, '../analysis.json'),
  retestJson: path.join(__dirname, '../retest.json')
};

var testsFile = fs.readFileSync(paths.testsJson).toString();
var tests = JSON.parse(testsFile);
// linear list of all tests
var allTests = _.flatten(_.map(_.values(tests), x => _.toPairs(x)));
// tests from the original audit; tests added later have no original results
var testList = allTests.filter(x => x[1].results).map(x => x[0]);
var newTests = allTests.filter(x => !x[1].results);
var newTestList = newTests.map(x => x[0]);
var newTestListAAA = newTests.filter(x => _.get(x[1], 'wcag.level') === 'AAA').map(x => x[0]);
var newTestListAAndAA = _.difference(newTestList, newTestListAAA);

var resultTypes = [
  'notfound',
  'error',
  'error_paid',
  'warning',
  'manual',
  'identified'
];

var toolNames = [
  'google',
  'tenon',
  'wave',
  'codesniffer',
  'axe',
  'asqatasun',
  'sortsite',
  'eiii',
  'achecker',
  'nu',
  'siteimprove',
  'fae',
  'aslint'
];

var analysis = {};

function analyse(){
  var tool = {};
  var test = {};
  var detectable = [];
  var percent = {};

  // Priming the tools array
  tool = _.reduce(toolNames, function (a, b){
    a[b] = _.reduce(resultTypes, (c, d) => { c[d] = 0; return c; }, {});
    return a;
  }, {});

  for( catname in tests ){
    for( testname in tests[catname] ){
      var resObj = tests[catname][testname]["results"];

      for( toolName in resObj ){
        tool[toolName][resObj[toolName]]++;
      }

      // Test is detectable by at least one tool
      var canDetect = _.without(
        _.values(resObj),
        'notfound',
        'identified'
      );

      if( canDetect.length > 0 ){
        detectable.push(testname);
      }
    }
  }

  analysis.counts = tool;

  analysis.totals = {
    total: testList.length,
    detectable: detectable.length,
    undetectable: testList.length - detectable.length
  }

  analysis.percentages = {
    detectable: _.round(analysis.totals.detectable / analysis.totals.total * 100),
    tools: {}
  }

  for( tool in analysis.counts ){
    var t = analysis.counts[tool];

    analysis.percentages.tools[tool] = {
      detectable: {
        "error_warning": _.round((t.error + t.error_paid + t.warning) / analysis.totals.detectable * 100),
        "error_warning_manual": _.round((t.error + t.error_paid + t.warning + t.manual) / analysis.totals.detectable * 100)
      },
      total: {
        "error_warning": _.round((t.error + t.error_paid + t.warning) / analysis.totals.total * 100),
        "error_warning_manual": _.round((t.error + t.error_paid + t.warning + t.manual) / analysis.totals.total * 100)
      }
    }
  }

  // [ [ 'google', 17 ], [ 'tenon', 37 ], ... ]
  var tr = _.map(_.get(analysis, 'percentages.tools'), (x,y) => [y, x.total.error_warning, x.total.error_warning_manual] );
  tr = tr.sort( (a, b) => b[1] - a[1] );
  tr_ew = tr.map(function (val, index){
    return {
      position: index + 1,
      name: val[0],
      error_warning: val[1],
      error_warning_manual: val[2],
    }
  });

  tr = tr.sort( (a, b) => b[2] - a[2] );
  tr_ewm = tr.map(function (val, index){
    return {
      position: index + 1,
      name: val[0],
      error_warning: val[1],
      error_warning_manual: val[2],
    }
  });

  analysis.scoreboard = {};
  analysis.scoreboard.by_error_warning = tr_ew;
  analysis.scoreboard.by_error_warning_manual = tr_ewm;

  analysis.retest = analyseRetest();

  fs.writeFileSync(paths.analysisJson, JSON.stringify(analysis,'',2), 'utf8');
}

// Scores for the retest, split so the original test cases can be compared
// with the original audit and the test cases added later reported separately.
function analyseRetest(){
  if( !fs.existsSync(paths.retestJson) ){
    return null;
  }

  var retest = JSON.parse(fs.readFileSync(paths.retestJson).toString());
  var sets = {
    original: testList,
    added: newTestList,
    added_a_aa: newTestListAAndAA,
    added_aaa: newTestListAAA,
    original_a_aa: testList.concat(newTestListAAndAA),
    all: testList.concat(newTestList)
  };

  var scores = {};
  _.forEach(retest.tools, function (info, toolName){
    scores[toolName] = _.mapValues(sets, function (list){
      var count = _.reduce(resultTypes, (c, d) => { c[d] = 0; return c; }, {});
      var tested = 0;

      list.forEach(function (testname){
        var res = _.get(retest.results, [testname, toolName]);
        if( res ){
          count[res]++;
          tested++;
        }
      });

      return {
        tested: tested,
        counts: count,
        error_warning: tested ? _.round((count.error + count.error_paid + count.warning) / tested * 100) : null,
        error_warning_manual: tested ? _.round((count.error + count.error_paid + count.warning + count.manual) / tested * 100) : null
      };
    });
  });

  // share of test cases found by at least one of the retest tools
  var retestToolNames = _.keys(retest.tools);
  var combined = _.mapValues(sets, function (list){
    return combinedScore(list.map(testname => retestToolNames.map(toolName => _.get(retest.results, [testname, toolName]))));
  });

  // the same for the original results of the tools that were retested
  var originalTests = _.fromPairs(allTests);
  combined.original_audit = combinedScore(testList.map(testname => [
    _.get(originalTests, [testname, 'results', 'axe']),
    _.get(originalTests, [testname, 'results', 'codesniffer'])
  ]));

  return {
    date: retest.date,
    tools: retest.tools,
    totals: _.mapValues(sets, list => list.length),
    scores: scores,
    combined: combined
  };
}

function combinedScore(resultsPerTest){
  var found = r => _.includes(['error', 'error_paid', 'warning'], r);
  var foundOrManual = r => found(r) || r === 'manual';

  return {
    tested: resultsPerTest.length,
    error_warning: _.round(resultsPerTest.filter(r => r.some(found)).length / resultsPerTest.length * 100),
    error_warning_manual: _.round(resultsPerTest.filter(r => r.some(foundOrManual)).length / resultsPerTest.length * 100)
  };
}

module.exports = {
  analyse: analyse,
  resultTypes: resultTypes,
  toolNames: toolNames
}
