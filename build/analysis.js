var fs = require('fs'),
    path = require('path'),
    _ = require('lodash');


var paths = {
  testsJson: path.join(__dirname, '../tests.json'),
  analysisJson: path.join(__dirname, '../analysis.json'),
  retestJson: path.join(__dirname, '../retest.json'),
  aiChecksJson: path.join(__dirname, '../ai-checks.json'),
  results: path.join(__dirname, '../results')
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
    combined: combined,
    ai: analyseAi(retest, sets)
  };
}

// Scores for the AI check (scripts/ai-check.mjs). A failure the AI reports
// counts as "intended" when it comes from a procedure written for that test
// case. The strict scores only count intended failures, because a page can
// fail for another reason than the barrier it was made for. The control
// pages have no known barrier, so every failure on them is a false positive.
function analyseAi(retest, sets){
  var aiPath = retest.ai && path.join(paths.results, retest.ai.date, 'ai.json');
  if( !aiPath || !fs.existsSync(aiPath) ){
    return null;
  }

  var raw = JSON.parse(fs.readFileSync(aiPath).toString());
  var aiChecks = JSON.parse(fs.readFileSync(paths.aiChecksJson).toString());
  var describedInText = aiChecks.describedInText;
  var toolsFind = testname => _.some(_.keys(retest.tools), toolName => _.get(retest.results, [testname, toolName]) === 'error');
  var percent = (n, total) => total ? _.round(n / total * 100) : null;

  function score(list){
    var cases = list.filter(testname => raw.cases[testname]);
    var count = r => cases.filter(testname => raw.cases[testname].result === r).length;
    // only test cases a procedure is written for can have an intended failure
    var covered = cases.filter(testname => raw.cases[testname].intendedChecks.length);
    var intended = covered.filter(testname => raw.cases[testname].intended).length;
    return {
      tested: cases.length,
      error: percent(count('error'), cases.length),
      error_manual: percent(count('error') + count('manual'), cases.length),
      covered: covered.length,
      intended: percent(intended, covered.length),
      // axe or pa11y, or the AI with a finding the review confirmed
      combined_confirmed: review ? percent(cases.filter(testname => toolsFind(testname) || confirmed(testname)).length, cases.length) : null,
      // axe or pa11y, or the AI with a failure from the intended procedure
      combined: percent(cases.filter(testname => toolsFind(testname) || raw.cases[testname].intended).length, cases.length),
      // the same, counting any AI failure
      combined_any: percent(cases.filter(testname => toolsFind(testname) || raw.cases[testname].result === 'error').length, cases.length)
    };
  }

  // the test cases neither axe nor pa11y finds, which the procedures are for
  var missed = sets.all.filter(testname => !toolsFind(testname));
  var missedNotInText = _.difference(missed, describedInText);
  // A second pass that read each finding and judged whether it describes the
  // barrier the test case was made for (results/<date>/ai-review.json)
  var reviewPath = path.join(paths.results, retest.ai.date, 'ai-review.json');
  var review = fs.existsSync(reviewPath) ? JSON.parse(fs.readFileSync(reviewPath).toString()) : null;
  var confirmed = testname => _.get(review, ['cases', testname, 'match']) === 'yes';

  var missedScore = list => {
    var cases = list.filter(testname => raw.cases[testname]);
    var intended = cases.filter(testname => raw.cases[testname].intended).length;
    var reviewed = review ? cases.filter(confirmed).length : null;
    return {
      tested: cases.length,
      intended: intended,
      intended_percent: percent(intended, cases.length),
      confirmed: reviewed,
      confirmed_percent: review ? percent(reviewed, cases.length) : null
    };
  };

  var controls = _.values(raw.controls);
  var controlCount = r => controls.filter(c => c.result === r).length;

  return {
    model: raw.model,
    effort: raw.effort,
    date: raw.date,
    checks: aiChecks.checks.length,
    sets: _.mapValues(sets, score),
    missed: missedScore(missed),
    missed_not_in_text: missedScore(missedNotInText),
    described_in_text: describedInText.length,
    review: review ? { method: review.method, counts: _.countBy(_.values(review.cases), 'match') } : null,
    controls: {
      tested: controls.length,
      notfound: controlCount('notfound'),
      manual: controlCount('manual'),
      error: controlCount('error'),
      false_positive: percent(controlCount('error'), controls.length)
    }
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
