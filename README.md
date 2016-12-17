# Broccoli Test Helpers

A small set of test helpers that allow you setup broccoli plugins for
testing.

### Install

```
npm install broccoli-test-helpers --save-dev
```

## Usage

Below is an example of the basic usage.
```js
var testHelpers = require('broccoli-test-helpers');
var expect = require('chai').expect;
var _myBroccoliPlugin = require('./lib');
var makeTestHelper = testHelpers.makeTestHelper;
var cleanupBuilders = testHelpers.cleanupBuilders;
var fs = require('fs');
var path = require('path');

var fixtures = path.join(process.cwd(), 'tests/fixtures');
var expectations = path.join(process.cwd(), 'tests/expectations');

describe('myBroccoliPlugin', function() {
  var myBroccoliPlugin = makeTestHelper({
    subject: _myBroccoliPlugin,
    fixturePath: fixtures
  });

  afterEach(function() {
    return cleanupBuilders();
  });

  it('should work', function() {
    return myBroccoliPlugin('.').then(function(result) {
      expect(result.files).to.deep.equal([
        'a.js',
        'b.js'
      ]);

      result.files.forEach(function(file) {
        expect(fs.readFileSync(path.join(result.directory, file), 'utf8')).to.equal(fs.readFileSync(path.join(expectations, file), 'utf8'));
      });

      // optionally you can test a rebuild by performing
      // some mutation on the files and then rebuilding.
      // You would then chain another .then() on the end
      // and preform assertions.
      //
      // return result.builder();
    });
  })
});
```
