import fs from 'fs';
import File from 'vinyl';
import gutil from 'gulp-util';
import {Plugin} from './plugin';
import {read_from_stream, debug} from './utils';

// Debug mode
// debug();

class Test extends Plugin {
  constructor(fail) {
    super('gulp-test');
    this.failure = fail;
  }
  handle_string(file, value, callback) {
    if (!this.failure) {
      file.contents = new Buffer("Hello");
      callback(null, file);
    }
    else {
      var error = new gutil.PluginError(this.name, value, {fileName: file.path});
      callback(error);
    }
  }
}

class GenTest extends Plugin {
  constructor() {
    super('gulp-gen-test');
    this.all = "";
    this.items = [];
  }
  configure(options) {
    this.options = options ? options : {};
    this.option('read', true, (v) => { return v !== null; });
    this.read = this.options.read;
  }
  handle_string(file, value, callback) {
    this.all += value;
    callback(); // Consume files, don't forward them.
  }
  handle_file(file, enc) {
    this.items.push(file.path);
  }
  handle_close(target, callback) {
    // Generate a file from the combined input
    this.file(target, 'out.txt', './', './', JSON.stringify({ all: this.all, items: this.items }));
    callback();
  }
}

export function test_plugin_with_buffer(test) {
  test.expect(1);

  var file = new File({ path: 'foo', cwd: 'tests/', base: 'tests/', contents: new Buffer("Hi") });
  var plugin = new Test().handler();
  var stream = plugin();
  read_from_stream(stream, 'utf8', function(value) {
    test.ok(value == "Hello");
    test.done();
  });

  stream.write(file);
  stream.end();
}

export function test_plugin_with_error(test) {
  try {
    var file = new File({ path: 'foo', cwd: 'tests/', base: 'tests/', contents: new Buffer("Hi") });
    var plugin = new Test(true).handler();
    var stream = plugin();
    read_from_stream(stream, 'utf8', function(value) {
      test.ok(false);  // Unreachable
    });

    stream.write(file);
    stream.end();
  }
  catch(err) {
    test.ok(true);
    test.done();
  }
}

export function test_plugin_with_stream(test) {
  test.expect(1);

  var file = new File({ path: 'other', cwd: 'tests/', base: 'tests/', contents: fs.createReadStream(__dirname + '/../gulpfile.babel.js') });
  var plugin = new Test().handler();
  var stream = plugin();
  read_from_stream(stream, 'utf8', function(value) {
    test.ok(value == "Hello");
    test.done();
  });

  stream.write(file);
  stream.end();
}

export function test_generator(test) {
  test.expect(2);

  var file1 = new File({ path: 'foo_hello', cwd: 'tests/', base: 'tests/', contents: new Buffer("Hello") });
  var file2 = new File({ path: 'bar_hello', cwd: 'tests/', base: 'tests/', contents: new Buffer("World") });
  var plugin = new GenTest().handler();
  var stream = plugin();
  read_from_stream(stream, 'utf8', function(value) {
    var out = JSON.parse(value);
    test.ok(out.all == "HelloWorld");
    test.ok(out.items.length == 2);
    test.done();
  });

  stream.write(file1);
  stream.write(file2);
  stream.end();
}

export function test_generator_wihtout_read(test) {
  test.expect(2);

  var file1 = new File({ path: 'foo_hello', cwd: 'tests/', base: 'tests/', contents: new Buffer("Hello") });
  var file2 = new File({ path: 'bar_hello', cwd: 'tests/', base: 'tests/', contents: new Buffer("World") });
  var plugin = new GenTest().handler();
  var stream = plugin({ read: false });
  read_from_stream(stream, 'utf8', function(value) {
    var out = JSON.parse(value);
    test.ok(out.all == "");
    test.ok(out.items.length == 2);
    test.done();
  });

  stream.write(file1);
  stream.write(file2);
  stream.end();
}
