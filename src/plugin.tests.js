import fs from 'fs';
import File from 'vinyl';
import {Plugin} from './plugin';
import {read_from_stream} from './utils';

class Test extends Plugin {
  constructor() {
    super('gulp-test');
  }
  handle_string(file, value, callback) {
    file.contents = new Buffer("Hello");
    callback(null, file);
  }
}

class GenTest extends Plugin {
  constructor() {
    super('gulp-gen-test');
    this.all = "";
  }
  handle_string(file, value, callback) {
    this.all += value;
    callback(); // Consume files, don't forward them.
  }
  handle_close(target, callback) {
    // Generate a file from the combined input
    this.file(target, 'out.txt', './', './', this.all);
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

export function test_plugin_with_stream(test) {
  test.expect(1);

  var file = new File({ path: 'other', cwd: 'tests/', base: 'tests/', contents: fs.createReadStream(__dirname + '/../gulpfile.js') });
  var plugin = new Test().handler();
  var stream = plugin();
  read_from_stream(stream, 'utf8', function(value) {
    test.ok(value == "Hello");
    test.done();
  });

  stream.write(file);
  stream.end();
}

export function test_generator(test2) {
  test2.expect(1);

  var file1 = new File({ path: 'foo_hello', cwd: 'tests/', base: 'tests/', contents: new Buffer("Hello") });
  var file2 = new File({ path: 'bar_hello', cwd: 'tests/', base: 'tests/', contents: new Buffer("World") });
  var plugin = new GenTest().handler();
  var stream = plugin();
  read_from_stream(stream, 'utf8', function(value) {
    test2.ok(value == "HelloWorld");
    test2.done();
  });

  stream.write(file1);
  stream.write(file2);
  stream.end();
}
