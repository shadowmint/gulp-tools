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

  _createClass(Plugin, [{
    key: 'handle_null',

    /**
     * Handle a null stream.
     * By default this does nothing.
     * Override for custom behaviour.
     * @param file The vinyl file object associated.
     * @param value The null target.
     * @param callback The (err, success) callback.
     */
    value: function handle_null(file, value, callback) {
      callback();
    }
  }, {
    key: 'handle_stream',

    /**
     * Handle a stream.
     * By default this converts the stream to a Buffer and calls handle_buffer()
     * Override for custom behaviour.
     * @param file The vinyl file object associated.
     * @param enc The file encoding string.
     * @param callback The (err, success) callback.
     */
    value: function handle_stream(file, enc, callback) {
      var _this = this;

      console.log('STREAM');
      var buffer = [];
      var completed = false;
      file.contents.on('error', function (err) {
        console.log('Error');
        console.log(err);
        var err = new _gulpUtil2['default'].PluginError(_this.name, 'Invalid stream: ' + err, { fileName: file.path });
        callback(err);
      });
      file.contents.on('readable', function () {
        console.log('***** readable on target');
        console.log(file);

        // Sometimes we get weird readable events on closed buffers.
        if (completed) {
          return;
        }

        // Normally, convert stream to buffer and return.
        while (true) {
          try {
            var read = file.contents.read();
            console.log(read);
            console.log('ok1');
            if (read != null) {
              console.log('ok2');
              buffer.push(read);
            } else {
              console.log('ok3');
              completed = true;
              file.contents = _buffertools2['default'].concat.apply(null, buffer);
              console.log('Completed file with: ' + file.contents);
              _this.handle_buffer(file, enc, callback);
              break;
            }
          } catch (err) {
            console.log(err);
            break;
          }
        }
      });
      console.log('waiting...');
    }
  }, {
    key: 'handle_buffer',

    /**
     * Handle a buffer.
     * By default this converts the stream to a string and calls handle_string()
     * Override for custom behaviour.
     * @param file The vinyl file object associated.
     * @param enc The file encoding string.
     * @param callback The (err, success) callback.
     */
    value: function handle_buffer(file, enc, callback) {
      var content = sutils.convert_to_string(file.contents, enc);
      console.log(content);
      this.handle_string(file, content, callback);
    }
  }, {
    key: 'handle_string',

    /**
     * Process some string value; this is the default plugin action.
     * If you don't override handle_buffer() and handle_stream(), implement this.
     * @param file The vinyl file object associated.
     * @param value The raw string value.
     * @param callback The (err, success) callback.
     */
    value: function handle_string(file, value, callback) {
      throw new Error('Not implemented');
    }
  }, {
    key: 'handle_close',

    /**
     * Override this handle stream completion if required
     * @param target The through2 target
     * @param callback The callback to invoke when done.
     */
    value: function handle_close(target, callback) {
      callback();
    }
  }, {
    key: 'configure',

    /** Override this to handle options if required */
    value: function configure(options) {
      this.options = options;
    }
  }, {
    key: 'handler',

    /** Return a handler function */
    value: function handler() {
      var self = this;
      return function (opts) {
        self.configure(opts);
        return _through22['default'].obj(function (file, enc, callback) {
          console.log('New file~');
          console.log(file);
          console.log(file.isNull());
          console.log(file.isStream());
          console.log(file.isBuffer());
          if (file.isNull()) {
            console.log('As null');
            self.handle_null(file, enc, callback);
          } else if (file.isStream()) {
            console.log('As stream');
            self.handle_stream(file, enc, callback);
          } else if (file.isBuffer()) {
            console.log('As buffer');
            self.handle_buffer(file, enc, callback);
          }
        }, function (callback) {
          self.handle_close(this, callback);
        });
      };
    }
  }, {
    key: 'file',

    /**
     * Generate a new file object and push it into the target
     * @param target The through2 target.
     * @param path The file path
     * @param cwd The current working directory
     * @param base The base path
     * @param contents The string to use as the file contents
     */
    value: function file(target, path, cwd, base, contents) {
      var fp = new _vinyl2['default']({ path: path, cwd: cwd, base: base, contents: new Buffer(contents) });
      console.log('New file');
      console.log(fp);
      target.push(fp);
    }
  }, {
    key: 'option',

    /** Apply a default value if an option is not present */
    value: function option(key, default_value, validator) {
      if (this.options[key] === undefined) {
        this.options[key] = default_value;
      } else {
        if (!validator) {
          validator = function (v) {
            return v ? true : false;
          };
        }
        if (!validator(this.options[key])) {
          var err = new _gulpUtil2['default'].PluginError(this.name, 'Invalid option: ' + key + ': ' + this.options[key]);
          throw err;
        }
      }
    }
  }]);

  return Plugin;
})();

exports.Plugin = Plugin;