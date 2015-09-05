import gutil from 'gulp-util';
import through  from 'through2';
import File from 'vinyl';
import * as sutils from './utils';
import buffertools from 'buffertools';

/** A simple 'text' based processing plugin base */
export class Plugin {

  /** Create a new plugin with the given name */
  constructor(name) {
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
   */
  handle_null(file, value, callback) {
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
  handle_stream(file, enc, callback) {
    file.contents.on('error', (err) => {
      var err = new gutil.PluginError(this.name, "Invalid stream: " + err, {fileName: file.path});
      callback(err);
    });
    sutils.read_from_stream(file.contents, enc, (content) => {
      this.handle_string(file, content, callback);
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
  handle_buffer(file, enc, callback) {
    var content = sutils.convert_to_string(file.contents, enc);
    this.handle_string(file, content, callback);
  }

  /**
   * Handle a file without explicitly converting to a string.
   * To avoid reading at all use read = false and set gulp to { read: false }
   */
  handle_file(file, enc) {
    // Default to doing nothing
  }

  /**
   * Process some string value; this is the default plugin action.
   * If you don't override handle_buffer() and handle_stream(), implement this.
   * @param file The vinyl file object associated.
   * @param value The raw string value.
   * @param callback The (err, success) callback.
   */
  handle_string(file, value, callback) {
    throw new Error('Not implemented');
  }

  /**
   * Override this handle stream completion if required
   * @param target The through2 target
   * @param callback The callback to invoke when done.
   */
  handle_close(target, callback) {
    callback();
  }

  /** Override this to handle options if required */
  configure(options) {
    this.options = options;
  }


  /** Return a handler function */
  handler() {
    var self = this;
    return function(opts) {
      self.configure(opts);
      return through.obj(function(file, enc, callback) {
        if (file.isNull()) {
          self.handle_null(file, enc, callback) ;
        }
        else if (file.isStream()) {
          self.handle_file(file, enc);
          self.read ? self.handle_stream(file, enc, callback) : callback();
        }
        else if (file.isBuffer()) {
          self.handle_file(file, enc);
          self.read ? self.handle_buffer(file, enc, callback) : callback();
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
  file(target, path, cwd, base, contents) {
    var fp = new File({ path: path, cwd: cwd, base: base, contents: new Buffer(contents) });
    target.push(fp)
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
  option(key, default_value, validator) {
    if (this.options[key] === undefined) {
      this.options[key] = default_value;
    }
    if (!validator) {
      validator = (v) => { return v ? true : false; };
    }
    if (!validator(this.options[key])) {
      var err = new gutil.PluginError(this.name, "Invalid option: " + key + ": " + this.options[key]);
      throw err;
    }
  }
}
