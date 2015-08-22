'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _gulpUtil = require('gulp-util');

var _gulpUtil2 = _interopRequireDefault(_gulpUtil);

var _through2 = require('through2');

var _through22 = _interopRequireDefault(_through2);

var _vinyl = require('vinyl');

var _vinyl2 = _interopRequireDefault(_vinyl);

var _utils = require('./utils');

var sutils = _interopRequireWildcard(_utils);

var _buffertools = require('buffertools');

var _buffertools2 = _interopRequireDefault(_buffertools);

/** A simple 'text' based processing plugin base */

var Plugin = (function () {

  /** Create a new plugin with the given name */

  function Plugin(name) {
    _classCallCheck(this, Plugin);

    this.name = name;
    this.options = {};
  }

  /**
   * Handle a null stream.
   * By default this does nothing.
   * Override for custom behaviour.
   * @param file The vinyl file object associated.
   * @param value The null target.
   * @param callback The (err, success) callback.
   */

  _createClass(Plugin, [{
    key: 'handle_null',
    value: function handle_null(file, value, callback) {
      callback();
    }

    /**
     * Handle a stream.
     * By default this converts the stream to a Buffer and calls handle_buffer()
     * Override for custom behaviour.
     * @param file The vinyl file object associated.
     * @param enc The file encoding string.
     * @param callback The (err, success) callback.
     */
  }, {
    key: 'handle_stream',
    value: function handle_stream(file, enc, callback) {
      var _this = this;

      file.contents.on('error', function (err) {
        var err = new _gulpUtil2['default'].PluginError(_this.name, "Invalid stream: " + err, { fileName: file.path });
        callback(err);
      });
      sutils.read_from_stream(file.contents, enc, function (content) {
        _this.handle_string(file, content, callback);
      });
    }

    /**
     * Handle a buffer.
     * By default this converts the stream to a string and calls handle_string()
     * Override for custom behaviour.
     * @param file The vinyl file object associated.
     * @param enc The file encoding string.
     * @param callback The (err, success) callback.
     */
  }, {
    key: 'handle_buffer',
    value: function handle_buffer(file, enc, callback) {
      var content = sutils.convert_to_string(file.contents, enc);
      this.handle_string(file, content, callback);
    }

    /**
     * Process some string value; this is the default plugin action.
     * If you don't override handle_buffer() and handle_stream(), implement this.
     * @param file The vinyl file object associated.
     * @param value The raw string value.
     * @param callback The (err, success) callback.
     */
  }, {
    key: 'handle_string',
    value: function handle_string(file, value, callback) {
      throw new Error('Not implemented');
    }

    /**
     * Override this handle stream completion if required
     * @param target The through2 target
     * @param callback The callback to invoke when done.
     */
  }, {
    key: 'handle_close',
    value: function handle_close(target, callback) {
      callback();
    }

    /** Override this to handle options if required */
  }, {
    key: 'configure',
    value: function configure(options) {
      this.options = options;
    }

    /** Return a handler function */
  }, {
    key: 'handler',
    value: function handler() {
      var self = this;
      return function (opts) {
        self.configure(opts);
        return _through22['default'].obj(function (file, enc, callback) {
          if (file.isNull()) {
            self.handle_null(file, enc, callback);
          } else if (file.isStream()) {
            self.handle_stream(file, enc, callback);
          } else if (file.isBuffer()) {
            self.handle_buffer(file, enc, callback);
          }
        }, function (callback) {
          self.handle_close(this, callback);
        });
      };
    }

    /**
     * Generate a new file object and push it into the target
     * @param target The through2 target.
     * @param path The file path
     * @param cwd The current working directory
     * @param base The base path
     * @param contents The string to use as the file contents
     */
  }, {
    key: 'file',
    value: function file(target, path, cwd, base, contents) {
      var fp = new _vinyl2['default']({ path: path, cwd: cwd, base: base, contents: new Buffer(contents) });
      target.push(fp);
    }

    /** Apply a default value if an option is not present */
  }, {
    key: 'option',
    value: function option(key, default_value, validator) {
      if (this.options[key] === undefined) {
        this.options[key] = default_value;
      }
      if (!validator) {
        validator = function (v) {
          return v ? true : false;
        };
      }
      if (!validator(this.options[key])) {
        var err = new _gulpUtil2['default'].PluginError(this.name, "Invalid option: " + key + ": " + this.options[key]);
        throw err;
      }
    }
  }]);

  return Plugin;
})();

exports.Plugin = Plugin;