'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.read_from_stream = read_from_stream;
exports.read_files_from_stream = read_files_from_stream;
exports.convert_to_string = convert_to_string;
exports.debug = debug;

var _string_decoder = require('string_decoder');

/** Safe handler; log exceptions */
function safe(x) {
  return function () {
    try {
      x.apply(null, arguments);
    } catch (ex) {
      console.log(ex);
      if (ex.stack) {
        console.log(ex.stack);
      }
    }
  };
};

/**
 * Invoke the callback after reading from the stream and converting the result to a string
 * @param stream A stream to read from.
 * @param callback The callback to run when done.
 */
function read_from_stream(stream, enc, callback) {
  var bufs = [];
  var foo = Math.random();
  stream.on('readable', safe(function () {
    while (true) {
      var read = stream.read();
      if (read) {
        if (read.contents) {
          bufs.push(read.contents);
        } else {
          bufs.push(read);
        }
      } else {
        break;
      }
    }
  }));
  stream.on('end', safe(function () {
    var all = Buffer.concat(bufs);
    var decoder = new _string_decoder.StringDecoder(enc);
    var content = decoder.write(all);
    callback(content);
  }));
}

/**
 * Invoke the callback after getting a file from the stream.
 * @param stream A stream to read from.
 * @param callback The callback to run when done.
 */
function read_files_from_stream(stream, callback) {
  var files = [];
  stream.on('readable', safe(function () {
    var read = stream.read();
    if (read) {
      files.push(read);
    }
  }));
  stream.on('end', safe(function () {
    callback(files);
  }));
}

/**
 * Decode a buffer of utf8 data into a string
 * @param buffer A node Buffer to process.
 * @param enc The encoding to use for the buffer.
 */
function convert_to_string(buffer, enc) {
  var decoder = new _string_decoder.StringDecoder(enc);
  var content = decoder.write(buffer);
  return content;
}

/** Debug console.log */
function debug() {
  ['log', 'warn'].forEach(function (method) {
    var old = console[method];
    console[method] = function () {
      var stack = new Error().stack.split(/\n/);
      // Chrome includes a single "Error" line, FF doesn't.
      if (stack[0].indexOf('Error') === 0) {
        stack = stack.slice(1);
      }
      var args = [].slice.apply(arguments).concat([stack[1].trim()]);
      return old.apply(console, args);
    };
  });
}