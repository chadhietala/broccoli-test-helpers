/*jshint node: true*/
var broccoli = require('broccoli');
var Promise  = require('rsvp').Promise;
var walkSync = require('walk-sync');
var builders = [];
 
function tree(plugin, fixturePath, filter) {
  var builder = new broccoli.Builder(plugin);
  var cwd = process.cwd();
 
  builders.push(builder);

  var build = function() {
    process.chdir(fixturePath);
    return builder.build().then(function(tree) {
      var entries = walkSync.entries(tree.directory);
      paths = entries.map(function(entry) {
        return entry.relativePath;
      });

      if (filter) {
        paths = filter(paths, tree);
      }

      return {
        files: paths,
        entries: entries,
        directory: tree.directory,
        builder: function() {
          return build().then(function(results) {
            process.chdir(cwd);
            return results;
          });
        },
        subject: plugin
      };
    });
  };

  return build().then(function(results) {
    process.chdir(cwd);
    return results;
  });
}
 
/**
 * Takes a test subject and returns the result of a
 * build with test subject applied to it.
 * 
 * @param  {Object} options
 * @property {Function} options.subject The function that is under test
 * @property {String} options.fixturePath The path to the fixtures being used for the test
 * @property {Function} [options.prepSubject] Lifecycle method called before the testing to allow you to setup spies on the test subject. You are passed the instance of the subject.
 * @property {Function} [options.filter] Filtering function that is applied to result of the build.
 * @return {Promise}
 */
function makeTestHelper(options) {
  var cwd = process.cwd();
  var Subject = options.subject;
  var filter = options.filter;
  var fixturePath = options.fixturePath;
  var prepSubject = options.prepSubject;

  return function() {
    var args = arguments;
    return new Promise(function(resolve) {
      var subject = Subject.apply(undefined, args);

      if (prepSubject) {
        subject = prepSubject(subject);
      }

      if (!subject) {
        throw new Error('You must return the subject instance from `prepSubject`.');
      }

      resolve(tree(subject, fixturePath, filter));
    }).finally(function() {
      process.chdir(cwd);
    });
  };
}
 
/**
 * Cleans up all the builders and optionally run a
 * callback.
 * @param  {Function} [cb]
 * @return {Promise}
 */
function cleanupBuilders(cb) {
  if (builders.length > 0) {
    return Promise.all(builders.map(function(builder) {
      if (cb) {
        cb();
      }
      return builder.cleanup();
    }));
  } else if (cb) {
    return Promise.resolve(cb());
  }
  
  return Promise.resolve();
}
 
module.exports = {
  makeTestHelper: makeTestHelper,
  cleanupBuilders: cleanupBuilders
};
