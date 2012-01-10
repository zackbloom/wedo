#!/usr/bin/env node

// Initially copied from bin/jade (8b8d4087)

/**
 * Module dependencies.
 */

var fs = require('fs')
  , path = require('path')
  , resolve = path.resolve
  , basename = path.basename
  , dirname = path.dirname
  , uglify = require('uglify-js')
  , compress = require('compress-buffer').compress
  , hashlib = require('hashlib')
  , knox = require('knox')
  , jade;

try {
  jade = require('../lib/jade');
} catch (err) {
  jade = require('jade');
}

var Compiler = jade.Compiler;

/**
 * Arguments.
 */

var args = process.argv.slice(2);

/**
 * Options javascript.
 */

var options = {};

/**
 * Destination dir.
 */

var dest;

/**
 * Watcher hash.
 */

var watchers;


//var PROD_ROOT = '//s3.amazonaws.com/speedyseat-files/'
var PROD_ROOT = '//cf.speedyseat.us/'
var SCRIPT_ROOT = '/home/zack/wedo/site/public/html'

/**
 * Usage information.
 */

var usage = ''
  + '\n'
  + '  Usage: jade [options]\n'
  + '              [path ...]\n'
  + '              < in.jade > out.jade'
  + '  \n'
  + '  Options:\n'
  + '    -o, --options <str>  JavaScript options object passed\n'
  + '    -h, --help           Output help information\n'
  + '    -w, --watch          Watch file(s) or folder(s) for changes and re-compile\n'
  + '    -v, --version        Output jade version\n'
  + '    -p, --prod           Merge script and stylesheets and push to S3\n'
  + '    -nu, --no-uglify     Don\'t uglify script files in prod mode\n'
  + '    --out <dir>          Output the compiled html to <dir>\n';
  + '\n';

// Parse arguments

var arg
  , files = []
  , PROD = false
  , UGLIFY = true;
while (args.length) {
  arg = args.shift();
  switch (arg) {
    case '-h':
    case '--help':
      console.log(usage);
      process.exit(1);
    case '-v':
    case '--version':
      console.log(jade.version);
      process.exit(1);
    case '-p':
    case '--prod':
      PROD = true;
      break;
    case '-nu':
    case '--no-uglify': 
      UGLIFY = false;
      break;
    case '-o':
    case '--options':
      var str = args.shift();
      if (str) {
        options = eval('(' + str + ')');
      } else {
        console.error('-o, --options requires a string.');
        process.exit(1);
      }
      break;
    case '-w':
    case '--watch':
      watchers = {};
      break;
    case '--out':
      dest = args.shift();
      break;
    default:
      files.push(arg);
  }
}

// Watching and no files passed - watch cwd
if (watchers && !files.length) {
  fs.readdirSync(process.cwd()).forEach(processFile);
// Process passed files
} else if (files.length) {
  files.forEach(processFile);
// Stdio
} else {
  var buf = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', function(chunk){
    buf += chunk;
  }).on('end', function(){
    console.log(jade.render(buf, options));
  }).resume();
}

/**
 * Filters
 */

var dependencies = [];

var add_dep = function(file){
  if (dependencies.indexOf(file) == -1)
    dependencies.push(file);
};

var strip_quotes = function(s){
  return s.substring(1, s.length - 1);
};

var concat_files = function(paths){
  out = "";
  for (var i=0; i < paths.length; i++){
    var path = paths[i];

    data = fs.readFileSync(path);
    out += data + "\n";
  }
  return out;
};

var uglify_script = function(code){
  try {
    var ast = uglify.parser.parse(code);
    ast = uglify.uglify.ast_mangle(ast);
    ast = uglify.uglify.ast_squeeze(ast);
    return uglify.uglify.gen_code(ast, {'ascii_only': true, 'beautify': true});
  } catch (e) {
    console.log("Script parsing error");
    console.log(e);
    
    console.log(code.substring(e.pos - 20, e.pos + 20));
  }
};

var hash_data = function(data){
  return hashlib.sha1(data);
};


jade.filters.prod = function(block, compiler, opts){
  var Visitor = function(node, opts) {
    this.node = node;
    this.opts = opts;
  }
  Visitor.prototype.__proto__ = Compiler.prototype;

  Visitor.prototype.visitBlock = function(block) {
    var self = this;

    if (!PROD || !block.nodes.length)
      return Compiler.prototype.visitBlock.call(this, block);

    var paths = {};
    // TODO: Add support for stylesheet media attr.
    for (var j=0; j < block.nodes.length; j++){
      var node = block.nodes[j];

      if (node.name != 'script' && (node.name != 'link' || node.getAttribute('rel') != '"stylesheet"')){
        Compiler.prototype.visit.call(this, node);
        continue;
      }

      var src = node.getAttribute('src') || node.getAttribute('href');

      if (!src)
        continue;

      src = src.substring(1, src.length - 1);
      src = path.join(SCRIPT_ROOT, src);
      
      if (!paths[node.name])
        paths[node.name] = [];
      paths[node.name].push(src);
    }
    
    var props = {
      'script': {
        'ext': 'js',
        'mime': 'text/javascript'
      },
      'link': {
        'ext': 'css',
        'mime': 'text/css'
      }
    };

    for (var type in paths){
      var pths = paths[type];
      var prop = props[type];

      var data = concat_files(pths);
      var raw_len = data.length;

      if (UGLIFY && type == 'script')
        data = uglify_script(data);
      var ug_len = data.length;

      data = compress(new Buffer(data));
      var com_len = data.length;
      
      console.log(raw_len + " / " + ug_len + " / " + com_len);

      var hash = hash_data(data);

      var fname = hash + '.' + prop.ext;

      console.log(fname);

      upload_file(fname, data, {
        "Content-Type": prop.mime,
        "Content-Encoding": "gzip"
      });

      var url = PROD_ROOT + fname;
      
      // TODO: Create nodes
      if (type == 'script')
        self.buffer('<script src="' + url + '" type="text/javascript"></script>');
      else
        self.buffer('<link rel="stylesheet" href="' + url + '" />');
    }
  }

  return new Visitor(block, opts).compile();
}


jade.filters.include_files = function(block, compiler, opts){
  var Visitor = function(node, opts) {
    this.node = node;
    this.path = strip_quotes(opts.path);
    this.first = opts.first ? strip_quotes(opts.first) : null;
  }

  Visitor.prototype.__proto__ = Compiler.prototype;

  Visitor.prototype.compile = function(){
    var self = this;

    this.buf = ['var interp;'];

    var files = fs.readdirSync(self.path);
    
    this.buf.push('var files=[];');
    for (var i=0; i < files.length; i++){
      var filename = files[i];

      if (filename.match(/\.jade$/)){
        // Jade is annoyingly synchronous, yet it uses an async call to
        // read the file, so it's impossible to render one template and use its
        // output in another using the readFile func.
         
        var p = path.join(self.path, filename);

        add_dep(p);

        var str = fs.readFileSync(p);
        var html = jade.render(str, options);
    
        var obj = {
          'filename': filename,
          'contents': html
        };

        if (!self.first || self.first != filename)
          self.buf.push('files.push(' + JSON.stringify(obj) + ');');
        else
          self.buf.push('files.splice(0, 0, ' + JSON.stringify(obj) + ');');
      }
    }

    this.visit(this.node);
    return this.buf.join('\n');
  };

  return new Visitor(block, opts).compile();
};

jade.filters.include_file = function(block, compiler, opts){
  var Visitor = function(node, opts) {
    this.node = node;
    this.path = strip_quotes(opts.path);
  }

  Visitor.prototype.__proto__ = Compiler.prototype;

  Visitor.prototype.compile = function(){
    var self = this;

    this.buf = ['var interp;'];

    add_dep(self.path);

    var str = fs.readFileSync(self.path);
    var html = jade.render(str, options);
    
    self.buf.push('var contents = ' + JSON.stringify(html) + ';');

    this.visit(this.node);
    return this.buf.join('\n');
  };

  return new Visitor(block, opts).compile();
};



/**
 * Process the given path, compiling the jade files found.
 * Always walk the subdirectories.;
 */

function processFile(path) {
  fs.lstat(path, function(err, stat) {
    if (err) throw err;
    // Found jade file
    if (stat.isFile() && path.match(/\.jade$/)) {
      renderJade(path);
    // Found directory
    } else if (stat.isDirectory()) {
      fs.readdir(path, function(err, files) {
        if (err) throw err;
        files.map(function(filename) {
          return path + '/' + filename;
        }).forEach(processFile);
      });
    }
  });
}

/**
 * Render jade
 */

CFILE = null;
function renderJade(jadefile) {
  // Updated by filters
  dependencies = [];

  jade.renderFile(jadefile, options, function(err, html) {
    if (err){
      console.error('Error with file ' + jadefile);
      console.error(err);
    } else {
      writeFile(jadefile, html, dependencies);
    }
  });
}

/**
 * mkdir -p implementation.
 */

function mkdirs(path, fn) {
  var segs = dirname(path).split('/')
    , dir = '';

  (function next() {
    var seg = segs.shift();
    if (seg) {
      dir += seg + '/';
      fs.mkdir(dir, 0755, function(err){
        if (!err) return next();
        if ('EEXIST' == err.code) return next();
      });
    } else {
      fn();
    }
  })();
}

/**
 * Write the html output to a file.
 */

function writeFile(src, html, deps) {
  var path = src.replace('.jade', '.html');
  if (dest) path = dest + '/' + path;
  mkdirs(path, function(err){
    if (err) throw err;
    fs.writeFile(path, html, function(err) {
      if (err) throw err;
      console.log('  \033[90mcompiled\033[0m %s', path);
      watch(src, renderJade);

      if (deps){
        for (var i=0; i < deps.length; i++){
          watch(deps[i], renderJade, src);
        }
      }
    });
  });
}

/**
 * Watch the given `file` and invoke `fn` when modified.
 */

function watch(file, fn, out_file) {
  out_file = out_file || file;
  // not watching
  if (!watchers) return;

  // already watched
  if (watchers[file]) return;

  // watch the file itself
  watchers[file] = true;
  console.log('  \033[90mwatching\033[0m %s', file);
  fs.watchFile(file, { interval: 50 }, function(curr, prev){
    if (curr.mtime > prev.mtime) fn(out_file);
  });
}
