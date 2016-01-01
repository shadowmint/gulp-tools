'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Plugin = undefined;

var _gulpUtil = require('gulp-util');

var _gulpUtil2 = _interopRequireDefault(_gulpUtil);

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

var _vinyl = require('vinyl');

var _vinyl2 = _interopRequireDefault(_vinyl);

var _utils = require('./utils');

var sutils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/** A simple 'text' based processing plugin base */

var Plugin = exports.Plugin = (function () {

  /** Create a new plugin with the given name */

  function Plugin(name) {
    _classCallCheck(this, Plugin);

    this.name = name;
    this.read = true;
    this.options = {};
  }

  /**
   * Handle a null stream.
   * By default this does nothing.
   * Override for custom behaviour.
   * @param file The vinyl file object associated.
   * @param value The null target.
   * @param callback The (err, success) callback.
   * @param fstream The stream, to push additional files through.
   */

  _createClass(Plugin, [{
    key: 'handle_null',
    value: function handle_null(file, value, callback, fstream) {
      callback();
    }

    /**
     * Handle a stream.
     * By default this converts the stream to a Buffer and calls handle_buffer()
     * Override for custom behaviour.
     * @param file The vinyl file object associated.
     * @param enc The file encoding string.
     * @param callback The (err, success) callback.
     * @param fstream The stream, to push additional files through.
     */

  }, {
    key: 'handle_stream',
    value: function handle_stream(file, enc, callback, fstream) {
      var _this = this;

      file.contents.on('error', function (err) {
        var err = new _gulpUtil2.default.PluginError(_this.name, "Invalid stream: " + err, { fileName: file.path });
        callback(err);
      });
      sutils.read_from_stream(file.contents, enc, function (content) {
        _this.handle_string(file, content, callback, fstream);
      });
    }

    /**
     * Handle a buffer.
     * By default this converts the stream to a string and calls handle_string()
     * Override for custom behaviour.
     * @param file The vinyl file object associated.
     * @param enc The file encoding string.
     * @param callback The (err, success) callback.
     * @param fstream The stream, to push additional files through.
     */

  }, {
    key: 'handle_buffer',
    value: function handle_buffer(file, enc, callback, fstream) {
      var content = sutils.convert_to_string(file.contents, enc);
      this.handle_string(file, content, callback, fstream);
    }

    /**
     * Handle a file without explicitly converting to a string.
     * To avoid reading at all use read = false and set gulp to { read: false }
     * @param The file object
     * @param The encoding
     * @param fstream The stream, to push additional files through.
     */

  }, {
    key: 'handle_file',
    value: function handle_file(file, enc, fstream) {}
    // Default to doing nothing

    /**
     * Process some string value; this is the default plugin action.
     * If you don't override handle_buffer() and handle_stream(), implement this.
     * @param file The vinyl file object associated.
     * @param value The raw string value.
     * @param callback The (err, success) callback.
     * @param fstream The stream, to push additional files through.
     */

  }, {
    key: 'handle_string',
    value: function handle_string(file, value, callback, fstream) {
      throw new Error('Not implemented');
    }

    /**
     * Override this handle stream completion if required
     * @param fstream The through2 target
     * @param callback The callback to invoke when done.
     */

  }, {
    key: 'handle_close',
    value: function handle_close(fstream, callback) {
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
        return _through2.default.obj(function (file, enc, callback) {
          if (file.isNull()) {
            self.handle_null(file, enc, callback, this);
          } else if (file.isStream()) {
            self.handle_file(file, enc, this);
            self.read ? self.handle_stream(file, enc, callback, this) : callback();
          } else if (file.isBuffer()) {
            self.handle_file(file, enc, this);
            self.read ? self.handle_buffer(file, enc, callback, this) : callback();
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
      var fp = new _vinyl2.default({ path: path, cwd: cwd, base: base, contents: new Buffer(contents) });
      target.push(fp);
    }

    /**
     * Apply a default value if an option is not present
     * To use, override configure:
     *
     *  configure(options) {
     *    this.options = options ? options : {};
     *    this.option('paths', ['a']);
     *    this.option('method', null, (v) => { return v != null; });
     *  }
     *
     */

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
        var err = new _gulpUtil2.default.PluginError(this.name, "Invalid option: " + key + ": " + this.options[key]);
        throw err;
      }
    }
  }]);

  return Plugin;
})();