'use strict';

const child = require('child_process');
const fs = require('fs');
const loaderUtils = require('loader-utils')

var Owl = {
    cache_fetched: false,
    already_compiled: [],
    compile_log: []
};

var warning = function(message) {
    Owl.emitWarning(new Error(message));
}

var error = function(message) {
    Owl.emitError(new Error(message));
}

function read_require(logical_path) {
    var source = null;
    var javascript = null;
    var logical_filename_rb;
    var logical_filename_js;
    var absolute_filename;
    if (logical_path.endsWith('.js')) {
        logical_filename_rb = logical_path + '.rb';
        logical_filename_js = logical_path;
    } else if (logical_path.endsWith('.rb')) {
        logical_filename_rb = logical_path;
        logical_filename_js = null;
    } else {
        logical_filename_rb = logical_path + '.rb';
        logical_filename_js = logical_path + '.js';
    }
    var l = Owl.paths.length;

    // look up known entries
    for (var i = 0; i < l; i++) {
        // try .rb
        absolute_filename = Owl.paths[i] + '/' + logical_filename_rb;
        if (Owl.entries.includes(absolute_filename)) {
            if (fs.existsSync(absolute_filename)) {
                source = fs.readFileSync(absolute_filename);
                break;
            }
        }
        // try .js
        if (logical_filename_js) {
            absolute_filename = Owl.paths[i] + '/' + logical_filename_js;
            if (Owl.entries.includes(absolute_filename)) {
                if (fs.existsSync(absolute_filename)) {
                    javascript = fs.readFileSync(absolute_filename);
                    break;
                }
            }
        }
    }
    if (source) { return { source: source, javascript: javascript, filename: absolute_filename };}

    // look up file system
    for (var i = 0; i < l; i++) {
        if (Owl.paths[i].startsWith(process.cwd())) {
            // try .rb
            absolute_filename = Owl.paths[i] + '/' + logical_filename_rb;
            if (fs.existsSync(absolute_filename)) {
                source = fs.readFileSync(absolute_filename);
                break;
            }
            // try .js
            if (logical_filename_js) {
                absolute_filename = Owl.paths[i] + '/' + logical_filename_js;
                if (fs.existsSync(absolute_filename)) {
                    javascript = fs.readFileSync(absolute_filename);
                    break;
                }
            }
        }
    }
    return { source: source, javascript: javascript, filename: absolute_filename };
}

function compile_requires(accumulator, requires) {
    var r_length = requires.length;
    for (var i = 0; i < r_length; i++) {
        if (!Owl.already_compiled.includes(requires[i])) {
            var req = read_require(requires[i]);
            if (req.javascript !== null) {
                accumulator.javascript += req.javascript + 'Opal.loaded(["' + requires[i] + '"]);\n';
            } else if (req.source !== null) {
                compile_ruby(accumulator, req.source, requires[i]);
            }
        }
    }
}

function compile_ruby(accumulator, source, module) {
    var compiler;
    var unified_source = (typeof source === 'object') ? source.toString() : source;
    if (module) {
        compiler = Opal.Opal.$const_get('Compiler').$new(unified_source, Opal.hash({requirable: true, file: module}));
    } else {
        compiler = Opal.Opal.$const_get('Compiler').$new(unified_source);
    }
    compiler.$compile();
    var requires = compiler.$requires();
    if (requires.length > 0) {
        compile_requires(accumulator, requires);
    }
    // requires = compiler.$required_trees()
    // if (requires.length > 0) {
    //     result = compile_required_trees();
    //     javascript += result.javascript;
    // }

    var tsm = compiler.$source_map().$to_json().$to_n();
    tsm.sourcesContent = [unified_source];
    delete tsm.file;
    accumulator.source_map.sections.push({
        offset: { line: accumulator.javascript.split('\n').length, column: 0 },
        map: tsm
    });
    accumulator.javascript += compiler.$result() + '\n';
    if (module) { Owl.already_compiled.push(module)}
}

function get_directory_entries(path) {
    if (!path.startsWith('/')) { return [] }
    if (path.startsWith(process.cwd())) { return [] }
    if (!fs.existsSync(path)) { return [] }
    var directory_entries = [];
    var f = fs.openSync(path, 'r');
    var is_dir = fs.fstatSync(f).isDirectory();
    fs.closeSync(f);
    if (is_dir) {
        var entries = fs.readdirSync(path);
        var e_length = entries.length;
        for (var k = 0; k < e_length; k++) {
            var current_path = path + '/' + entries[k];
            if (fs.existsSync(current_path)) {
                var fe = fs.openSync(current_path, 'r');
                var se = fs.fstatSync(fe);
                var eis_dir = se.isDirectory();
                var eis_file = se.isFile();
                fs.closeSync(fe);
                if (eis_dir) {
                    var more_entries = get_directory_entries(current_path);
                    var m_length = more_entries.length;
                    for (var m = 0; m < m_length; m++) {
                        directory_entries.push(more_entries[m]);
                    }
                } else if (eis_file) {
                    if (current_path.endsWith('.rb') || current_path.endsWith('.js')) {
                        directory_entries.push(current_path);
                    }
                }
            }
        }
    }
    return directory_entries;
}

function get_load_path_entries(load_paths) {
    var load_path_entries = [];
    var lp_length = load_paths.length;
    for (var i = 0; i < lp_length; i++) {
        var dir_entries = get_directory_entries(load_paths[i]);
        var d_length = dir_entries.length;
        for (var k = 0; k < d_length; k++) {
            load_path_entries.push(dir_entries[k]);
        }
    }
    return load_path_entries;
}

module.exports = function(source, map, meta) {
    this.cacheable && this.cacheable();
    Owl.emitWarning = this.emitWarning;
    Owl.emitError = this.emitError;

    var callback = this.async();
    var result = 'console.log("Hello from opal-webpack-loader :)");\n';

    // Get opal load paths from cache and generate cache if not yet there or needs update

    var owl_cache = {};
    var owl_cache_mtime = 0;
    var must_generate_cache = false;

    const gemfile_path = 'Gemfile';
    const gemfile_lock_path = 'Gemfile.lock';
    const owl_cache_path = '.opal_webpack_loader_cache.json';
    const owl_compiler_path = '.opal_webpack_loader_compiler.js';

    fs.accessSync(gemfile_path, fs.constants.R_OK);
    fs.accessSync(gemfile_lock_path, fs.constants.R_OK);
    try {
        fs.accessSync(owl_cache_path, fs.constants.R_OK | fs.constants.W_OK);
    } catch (err) {
        fs.writeFileSync(owl_cache_path, JSON.stringify(owl_cache));
        owl_cache_mtime = fs.statSync(owl_cache_path).mtimeMs;
        must_generate_cache = true;
    }

    var gemfile_mtime = fs.statSync(gemfile_path).mtimeMs;
    var gemfile_lock_mtime = fs.statSync(gemfile_lock_path).mtimeMs;

    if (owl_cache_mtime === 0) { owl_cache_mtime = fs.statSync(owl_cache_path).mtimeMs; }

    // warning('Gemfile mtime: ' + gemfile_mtime);
    // warning('Gemfile.lock mtime: ' + gemfile_lock_mtime);
    // warning('owl cache mtime: ' + owl_cache_mtime);

    if (gemfile_mtime > gemfile_lock_mtime) { error("Gemfile is newer than Gemfile.lock, please run 'bundle install' or 'bundle update'!"); }
    if (gemfile_lock_mtime > owl_cache_mtime || must_generate_cache) {
        // generate cache
        var child_result = '';
        if (fs.existsSync('bin/rails')) {
            child_result = child.execSync('bundle exec rails runner "puts Opal.paths; exit 0"');
        } else {
            child_result = child.execSync('bundle exec ruby -e "Bundler.require; puts Opal.paths; exit 0"');
        }
        var child_result_lines = child_result.toString().split('\n');
        var crl_length = child_result_lines.length;
        if (child_result_lines[crl_length-1] === '' || child_result_lines[crl_length-1] == null) {
            child_result_lines.pop();
        }
        owl_cache.opal_load_paths = child_result_lines;
        owl_cache.opal_load_path_entries = get_load_path_entries(owl_cache.opal_load_paths);
        Owl.paths = owl_cache.opal_load_paths;
        Owl.entries = owl_cache.opal_load_path_entries;
        Owl.cache_fetched = true;
        fs.writeFileSync(owl_cache_path, JSON.stringify(owl_cache));
    } else {
        if (!Owl.cache_fetched) {
            // fetch cache
            var owl_cache_from_file = fs.readFileSync(owl_cache_path);
            owl_cache = JSON.parse(owl_cache_from_file.toString());
            Owl.paths = owl_cache.opal_load_paths;
            Owl.entries = owl_cache.opal_load_path_entries;
            Owl.cache_fetched = true;
        }
    }

    // load or compile and cache compiler
    if (gemfile_lock_mtime > owl_cache_mtime || must_generate_cache || !fs.existsSync(owl_compiler_path)) {
        if (fs.existsSync('bin/rails')) {
            child_result = child.execSync('bundle exec rails runner "puts \\\$LOAD_PATH; exit 0"');
        } else {
            child_result = child.execSync('bundle exec ruby -e "Bundler.require; puts \\\$LOAD_PATH; exit 0"');
        }
        child_result_lines = child_result.toString().split('\n');
        var load_path_options = '';
        crl_length = child_result_lines.length;
        if (child_result_lines[crl_length-1] === '' || child_result_lines[crl_length-1] == null) {
            child_result_lines.pop();
            crl_length = child_result_lines.length;
        }
        for (var i = 0; i < crl_length; i++) {
            load_path_options += ' --include ' + child_result_lines[i];
        }
        // this implments Regexp.names, becasue thats missing in opal 0.11 and before
        // TODO remove Regexp.names once it is in opal
        child.execSync("bundle exec opal" + load_path_options + " -E -ce '" + "" +
            "require \"opal\";" +
            "require \"opal-platform\";" +
            "require \"opal/source_map\";" +
            "require \"source_map\";" +
            "require \"opal/compiler\";" +
            "require \"nodejs\";" +
            "require \"native\";" +
            "class Regexp;" +
            "def names;" +
            "`var result = [];" +
            "var splits = self.source.split(\"(?<\");" +
            "var sl = splits.length;" +
            "for (var i = 0; i < sl; i ++) { " +
            "var matchres = splits[i].match(/(\\w+)>/);" +
            "if (matchres && matchres[1]) {" +
            "result.push(matchres[1]);}}" +
            "return result;`" +
            "end;" +
            "end" +
            "' > " + owl_compiler_path);
        require(process.cwd() + '/' + owl_compiler_path);
    } else {
        if (typeof Opal === "undefined") {
            require(process.cwd() + '/' + owl_compiler_path);
        }
    }

    // get additional options

    const options = loaderUtils.getOptions(this);
    for (var property in options) {
        if (options.hasOwnProperty(property)) {
            warning('options are: ' + property + ': ' + options[property]);
        }
    }

    // compile the source
    var accumulator = {
        javascript: '',
        source_map: {
            version: 3,
            sections: [], // this is where the maps go
        }
    }

    compile_ruby(accumulator, source);

    delete Owl.emitError;
    delete Owl.emitWarning;
    fs.writeFileSync('owl_status.json', JSON.stringify(Owl));
    fs.writeFileSync('owl_out.js', accumulator.javascript);
    fs.writeFileSync('owl_out_source_map.json', JSON.stringify(accumulator.source_map));
    Owl.already_compiled = [];

    callback(null, accumulator.javascript, accumulator.source_map, meta);

    return;
};