var nunjucks = require('nunjucks'),
    fs = require('fs'),
    path = require('path'),
    analysis = require('./analysis');

var paths = {
  testsJson: path.join(__dirname, '../tests.json'),
  analysisJson: path.join(__dirname, '../analysis.json'),
  changelogJson: path.join(__dirname, '../changelog.json'),
  retestJson: path.join(__dirname, '../retest.json'),
  templates: path.join(__dirname, 'templates'),
  outPath: path.join(__dirname, '../'),
  out: fname => path.join(paths.outPath, fname)
};

var resultsCopy = {
  "error": "issue found",
  "error_paid": "issue found (paid)",
  "warning": "warning only",
  "notfound": "not found",
  "identified": "noticed but not a fail",
  "manual": "user to check"
};

var toolNamesCopy = {
  "tenon": "Tenon",
  "achecker": "AChecker",
  "axe": "aXe",
  "asqatasun": "Asqatasun",
  "sortsite": "SortSite",
  "wave": "WAVE",
  "codesniffer": "HTML_CodeSniffer",
  "google": "Google ADT",
  "eiii": '<abbr title="European Internet Inclusion Initiative">EIII</abbr>',
  "nu": "Nu Html Checker",
  "siteimprove": "Siteimprove",
  "fae": '<abbr title="Functional Accessibility Evaluator">FAE</abbr>',
  "aslint": "ASLint"
}

var tools = {
  "tenon": {
    name: toolNamesCopy["tenon"],
    url: "https://tenon.io/"
  },
  "achecker": {
    name: toolNamesCopy["achecker"],
    url: "http://achecker.ca/"
  },
  "axe": {
    name: toolNamesCopy["axe"],
    url: "https://www.axe-core.org/"
  },
  "asqatasun": {
    name: toolNamesCopy["asqatasun"],
    url: "http://asqatasun.org/"
  },
  "sortsite": {
    name: toolNamesCopy["sortsite"],
    url: "https://www.powermapper.com/products/sortsite/"
  },
  "wave": {
    name: toolNamesCopy["wave"],
    url: "http://wave.webaim.org/extension/"
  },
  "codesniffer": {
    name: toolNamesCopy["codesniffer"],
    url: "https://squizlabs.github.io/HTML_CodeSniffer/"
  },
  "google": {
    name: toolNamesCopy["google"],
    url: "https://github.com/GoogleChrome/accessibility-developer-tools"
  },
  "eiii": {
    name: toolNamesCopy["eiii"],
    url: "http://checkers.eiii.eu/"
  },
  "nu": {
    name: toolNamesCopy["nu"],
    url: "https://validator.w3.org/nu/"
  },
  "siteimprove": {
    name: toolNamesCopy["siteimprove"],
    url: "https://siteimprove.com/"
  },
  "fae": {
    name: toolNamesCopy["fae"],
    url: "https://fae.disability.illinois.edu/"
  },
  "aslint": {
    name: toolNamesCopy["aslint"],
    url: "https://www.aslint.org/"
  }
}

// Tools used in the retest, see scripts/retest.mjs
var retestTools = {
  "axe": {
    name: "axe-core",
    url: "https://github.com/dequelabs/axe-core"
  },
  "pa11y": {
    name: "pa11y",
    url: "https://pa11y.org/"
  }
}

// This copy of the audit and the original, used to tell the two apart on every page
var copyInfo = {
  repo: "https://github.com/a11y-intuition-lab/accessibility-tool-audit",
  org: { name: "A11y Intuition Lab", url: "https://a11yintuition.org/" },
  methodPage: "method.html",
  originalRepo: "https://github.com/alphagov/accessibility-tool-audit",
  originalSite: "https://alphagov.github.io/accessibility-tool-audit/"
}

function getFilename( catname, testname ){
    var filename = [catname.toLowerCase(), testname.toLowerCase()]
                      .join('-')
                      .replace(/[^a-z0-9\-\ ]/, '')
                      .replace('/', ' ')
                      .replace(':', '-')
                      .replace(/\s+/g, '-')
                      .replace(/-+/g, '-');

    return filename;
}

function processExample( example ){
  if( example.indexOf('images') > -1 ){
    example = example.replace(/images\//g, '../assets/test_images/');
  }

  if( example.indexOf('example-pages') > -1 ){
    example = example.replace(/example-pages\//g, '../example-pages/');
  }

  example = example.replace(/src="media\//g, 'src="../assets/test_media/');

  return example;
}

function generateFiles(){
  var testsFile = fs.readFileSync(paths.testsJson).toString();
  var tests = JSON.parse(testsFile);

  analysis.analyse();
  var analysisResults = require(paths.analysisJson);

  var changelog = fs.readFileSync(paths.changelogJson).toString();
  var changes = JSON.parse(changelog);

  var retest = fs.existsSync(paths.retestJson)
    ? JSON.parse(fs.readFileSync(paths.retestJson).toString())
    : null;

  var env = nunjucks.configure(paths.templates);
  env.addGlobal('copyInfo', copyInfo);

  // Generate index
  var indexout = nunjucks.render('index.html', {
    tests: tests,
    getFilename: getFilename,
    analysis: analysisResults,
    tools: tools,
    retest: retest,
    retestTools: retestTools,
    changes: changes
  });
  fs.writeFileSync(paths.out('index.html'), indexout, 'utf8');

  // Generate test cases

  var indexout = nunjucks.render('test-cases.html', {
    tests: tests,
    getFilename: getFilename,
    retest: retest
  });
  fs.writeFileSync(paths.out('test-cases.html'), indexout, 'utf8');

  // Generate the page about how this copy was made

  var methodout = nunjucks.render('method.html', {
    analysis: analysisResults,
    retest: retest
  });
  fs.writeFileSync(paths.out('method.html'), methodout, 'utf8');

  // Generate individual tests

  for( catname in tests ){
    for( testname in tests[catname] ){
      var testObj = tests[catname][testname];

      var filename = getFilename( catname, testname );

      var filecontent = nunjucks.render('single-test.html', {
        testname: testname,
        example: processExample(testObj.example)
      });

      fs.writeFileSync(paths.out('tests/' + filename + ".html"), filecontent, 'utf8');
    }
  }

  // Empty page used by scripts/retest.mjs to ignore findings caused by the template
  var baselineout = nunjucks.render('single-test.html', {
    testname: 'Baseline (no test case)',
    example: ''
  });
  fs.writeFileSync(paths.out('tests/_baseline.html'), baselineout, 'utf8');

  // Generate results
  var resultsout = nunjucks.render('results.html', {
    tests: tests,
    rcopy: resultsCopy,
    getFilename: getFilename,
    analysis: analysisResults,
    resultTypes: analysis.resultTypes,
    toolNames: analysis.toolNames,
    retest: retest,
    retestTools: retestTools,
    changes: changes
  });
  fs.writeFileSync(paths.out('results.html'), resultsout, 'utf8');
}

module.exports = {
  generate: generateFiles,
  getFilename: getFilename
}

if (require.main === module) {
  generateFiles();
}
