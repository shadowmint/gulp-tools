import {StringDecoder} from 'string_decoder';
import buffertools from 'buffertools';

/** Safe handler; log exceptions */
function safe(x) {
  return function() {
    try { x.apply(null, arguments); } catch(ex) {
      console.log(ex.stack);
    }
  };
};

/**
 * Invoke the callback after reading from the stream and converting the result to a string
 * @param stream A stream to read from.
 * @param callback The callback to run when done.
 */
export function read_from_stream(stream, callback) {
  var bufs = [];
  stream.on('readable', safe(function() {
    var read = stream.read();
    if (read) {
      if (read.contents) {
        bufs.push(read.contents);
      }
      else {
        bufs.push(read);
      }
    }
  }));
  stream.on('end', safe(function() {
    var all = buffertools.concat.apply(null, bufs);
    var decoder = new StringDecoder('utf8');
    var content = decoder.write(all);
    callback(content);
  }));
}

/**
 * Invoke the callback after getting a file from the stream.
 * @param stream A stream to read from.
 * @param callback The callback to run when done.
 */
export function read_files_from_stream(stream, callback) {
  var files = [];
  stream.on('readable', safe(function() {
    var read = stream.read();
    if (read) {
      files.push(read);
    }
  }));
  stream.on('end', safe(function() {
    callback(files);
  }));
}

/**
 * Decode a buffer of utf8 data into a string
 * @param buffer A node Buffer to process.
 * @param enc The encoding to use for the buffer.
 */
export function convert_to_string(buffer, enc) {
  var decoder = new StringDecoder(enc);
  var content = decoder.write(buffer);
	return content;
}
