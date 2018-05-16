'use strict';

const child = require('child_process');
const fs = require('fs');
const loaderUtils = require('loader-utils');
const md5 = require('js-md5');
// const UglifyJS = require('uglify-js') // for minifying the compiler, disabled

// keep some global state
var Owl = {
    cache_fetched: false,
    already_compiled: [],
    compile_log: [] // for debugging
};

var warning = function(message) {
    Owl.emitWarning(new Error(message));
};

var error = function(message) {
    Owl.emitError(new Error(message));
};

function store_in_cache(filename, javascript, requires, required_trees, source_map_section) {
    var cache_key = md5(filename);
    var cc_fn = Owl.cc_dir + '/' + cache_key;
    var file_mtime = fs.statSync(filename).mtimeMs;
    var json_obj = {
        mtime: file_mtime,
        requires: requires,
        required_trees: required_trees,
        javascript: javascript,
        source_map_section: source_map_section
    };
    fs.writeFileSync(cc_fn, JSON.stringify(json_obj));
}

function fetched_from_cache(accumulator, filename, module) {
    var cache_key = md5(filename);
    var cc_fn = Owl.cc_dir + '/' + cache_key;
    if (fs.existsSync(cc_fn)) {
        var ccf = fs.readFileSync(cc_fn);
        var cc = JSON.parse(ccf.toString());
        // check paths within current dir/app for mtime
        // but dont check system gems, because cache gets cleaned up on Gemfile change/bundle install/update
        if (filename.startsWith(process.cwd())) {
            // check filename mtime
            var file_mtime = fs.statSync(filename).mtimeMs;
            if (file_mtime !== cc.mtime) { return false; }
        }
        compile_requires(accumulator, cc.requires, filename);
        compile_required_trees(accumulator, cc.required_trees, filename);
        accumulator.javascript += cc.javascript + '\n';
        accumulator.source_map.sections.push(cc.source_map_section);
        if (module) { Owl.already_compiled.push(module)}
        return true;
    }
    return false;
}

function read_require(logical_path, requester) {
    var source = null;
    var javascript = null;
    var logical_filename_rb;
    var logical_filename_js;
    var absolute_filename;
    if (logical_path.endsWith('.js')) {
        logical_filename_rb = '/' + logical_path + '.rb';
        logical_filename_js = '/' + logical_path;
    } else if (logical_path.endsWith('.rb')) {
        logical_filename_rb = '/' + logical_path;
        logical_filename_js = null;
    } else {
        logical_filename_rb = '/' + logical_path + '.rb';
        logical_filename_js = '/' + logical_path + '.js';
    }
    var l = Owl.paths.length;

    // look up known entries
    for (var i = 0; i < l; i++) {
        // try .rb
        absolute_filename = Owl.paths[i] + logical_filename_rb;
        if (Owl.entries.includes(absolute_filename)) {
            if (fs.existsSync(absolute_filename)) {
                source = fs.readFileSync(absolute_filename);
                break;
            }
        }
        // try .js
        if (logical_filename_js) {
            absolute_filename = Owl.paths[i] + logical_filename_js;
            if (Owl.entries.includes(absolute_filename)) {
                if (fs.existsSync(absolute_filename)) {
                    javascript = fs.readFileSync(absolute_filename);
                    break;
                }
            }
        }
    }
    if (source || javascript) { return { source: source, javascript: javascript, filename: absolute_filename }; }

    // look up file system
    for (var i = 0; i < l; i++) {
        if (Owl.paths[i].startsWith(process.cwd())) {
            // try .rb
            absolute_filename = Owl.paths[i] + logical_filename_rb;
            if (fs.existsSync(absolute_filename)) {
                source = fs.readFileSync(absolute_filename);
                break;
            }
            // try .js
            if (logical_filename_js) {
                absolute_filename = Owl.paths[i] + logical_filename_js;
                if (fs.existsSync(absolute_filename)) {
                    javascript = fs.readFileSync(absolute_filename);
                    break;
                }
            }
        }
    }
    if (source || javascript) {
        return { source: source, javascript: javascript, filename: absolute_filename };
    } else {
        error('opal-webpack-loader: Unable to locate module "' + logical_path + '" included by ' + requester);
        return null;
    }
}

function compile_required_trees(accumulator, required_trees, requester) {
    var path_elements = requester.split('/');
    path_elements.pop();
    var base_path = path_elements.join('/') + '/';
    var base_length = base_path.length;
    var rt_length = required_trees.length;
    for (var i = 0; i < rt_length; i++) {
        var directory_path = base_path + required_trees[i];
        var directory_entries = get_directory_entries(directory_path, true);
        var d_length = directory_entries.length;
        for (var k = 0; k < d_length; k++) {
            // determine module
            var mod_path = directory_entries[k].substr(base_length).split('.');
            mod_path.pop();
            var module = mod_path.join('.');
            if (!Owl.already_compiled.includes(module)) {
                var source = fs.readFileSync(directory_entries[k]);
                // compile module
                compile_ruby(accumulator, source, directory_entries[k], module)
            }
        }
    }
}

function compile_requires(accumulator, requires, requester) {
    var r_length = requires.length;
    for (var i = 0; i < r_length; i++) {
        if (!Owl.already_compiled.includes(requires[i])) {
            var req = read_require(requires[i], requester);
            if (req && req.javascript !== null) {
                include_javascript(accumulator, req.javascript, req.filename, requires[i]);
            } else if (req && req.source !== null) {
                compile_ruby(accumulator, req.source, req.filename, requires[i]);
            }
        }
    }
}

function include_javascript(accumulator, javascript, filename, module) {
    accumulator.javascript += javascript + 'Opal.loaded(["' + module + '"]);\n';
    if (module) { Owl.already_compiled.push(module)};
}

function compile_ruby(accumulator, source, filename, module) {
    // fetch from cache
    if (fetched_from_cache(accumulator, filename, module)) { return; }

    // or compile
    var compiler;
    var unified_source = (typeof source === 'object') ? source.toString() : source;
    if (module) {
        compiler = Opal.Opal.$const_get('Compiler').$new(unified_source, Opal.hash({requirable: true, file: module}));
    } else {
        compiler = Opal.Opal.$const_get('Compiler').$new(unified_source);
    }

    // compile the ruby source
    compiler.$compile();

    // compile 'require'-ed modules
    var requires = compiler.$requires();
    if (requires.length > 0) {
        compile_requires(accumulator, requires, filename);
    }

    // compile 'require_tree' modules
    var required_trees = compiler.$required_trees();
    if (required_trees.length > 0) {
        compile_required_trees(accumulator, required_trees, filename);
    }

    // get source map
    var tsm = compiler.$source_map(filename).$to_json().$to_n();
    tsm.sourcesContent = [unified_source];

    // accumulate everything
    var source_map_section = {
        offset: { line: accumulator.javascript.split('\n').length -1, column: 1 }, // these numbers point to the correct target
        map: tsm
    };
    accumulator.source_map.sections.push(source_map_section);
    var result = compiler.$result();
    accumulator.javascript += result + '\n';

    // store in cache
    store_in_cache(filename, result, requires, required_trees, source_map_section);

    // note module as compiled
    if (module) { Owl.already_compiled.push(module)}
}

function get_directory_entries(path, in_app) {
    if (!path.startsWith('/')) { return [] }
    if (!in_app && path.startsWith(process.cwd())) { return [] }
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
                    var more_entries = get_directory_entries(current_path, in_app);
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

function get_load_paths() {
    var load_paths;
    if (fs.existsSync('bin/rails')) {
        load_paths = child.execSync('bundle exec rails runner ' +
            '"puts (Rails.configuration.respond_to?(:assets) ? ' +
            '(Rails.configuration.assets.paths + Opal.paths).uniq : ' +
            'Opal.paths); exit 0"');
    } else {
        load_paths = child.execSync('bundle exec ruby -e "Bundler.require; puts Opal.paths; exit 0"');
    }
    var load_path_lines = load_paths.toString().split('\n');
    var lp_length = load_path_lines.length;
    if (load_path_lines[lp_length-1] === '' || load_path_lines[lp_length-1] == null) {
        load_path_lines.pop();
    }
    return load_path_lines;
}

function get_load_path_entries(load_paths) {
    var load_path_entries = [];
    var lp_length = load_paths.length;
    for (var i = 0; i < lp_length; i++) {
        var dir_entries = get_directory_entries(load_paths[i], false);
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

    // Get opal load paths from cache and generate cache if not yet there or needs update

    var owl_cache = {};
    var owl_cache_mtime = 0;
    var must_generate_cache = false;

    const gemfile_path = 'Gemfile';
    const gemfile_lock_path = 'Gemfile.lock';
    const owl_cache_dir = '.owl_cache';
    const owl_compiler_cache_dir = owl_cache_dir + '/cc';
    const owl_cache_path = owl_cache_dir + '/load_paths.json';
    const owl_compiler_path = owl_cache_dir + '/compiler.js';

    fs.accessSync(gemfile_path, fs.constants.R_OK);
    fs.accessSync(gemfile_lock_path, fs.constants.R_OK);
    try {
        fs.accessSync(owl_cache_path, fs.constants.R_OK | fs.constants.W_OK);
    } catch (err) {
        if (!fs.existsSync(owl_cache_dir)) { fs.mkdirSync(owl_cache_dir); }
        if (!fs.existsSync(owl_compiler_cache_dir)) { fs.mkdirSync(owl_compiler_cache_dir); }
        fs.writeFileSync(owl_cache_path, JSON.stringify(owl_cache));
        owl_cache_mtime = fs.statSync(owl_cache_path).mtimeMs;
        must_generate_cache = true;
    }

    var gemfile_mtime = fs.statSync(gemfile_path).mtimeMs;
    var gemfile_lock_mtime = fs.statSync(gemfile_lock_path).mtimeMs;

    if (owl_cache_mtime === 0) { owl_cache_mtime = fs.statSync(owl_cache_path).mtimeMs; }

    // for debugging
    // warning('Gemfile mtime: ' + gemfile_mtime);
    // warning('Gemfile.lock mtime: ' + gemfile_lock_mtime);
    // warning('owl cache mtime: ' + owl_cache_mtime);

    if (gemfile_mtime > gemfile_lock_mtime) { error("Gemfile is newer than Gemfile.lock, please run 'bundle install' or 'bundle update'!"); }
    if (gemfile_lock_mtime > owl_cache_mtime || must_generate_cache) {
        // clean up compiler cache
        var cc_entries = fs.readdirSync(owl_compiler_cache_dir);
        var cce_length = cc_entries.length;
        for (var i = 0; i < cce_length; i++) {
            fs.unlinkSync(owl_compiler_cache_dir + '/' + cc_entries[i]);
        }

        // generate load path cache
        owl_cache.opal_load_paths = get_load_paths();
        owl_cache.opal_load_path_entries = get_load_path_entries(owl_cache.opal_load_paths);
        Owl.paths = owl_cache.opal_load_paths;
        Owl.entries = owl_cache.opal_load_path_entries;
        Owl.cc_dir = owl_compiler_cache_dir;
        Owl.cache_fetched = true;
        fs.writeFileSync(owl_cache_path, JSON.stringify(owl_cache));

        // compile compiler
        if (!fs.existsSync(owl_compiler_path)) {
            var load_path_options = '';
            var lp_length = owl_cache.opal_load_paths.length;
            for (var i = 0; i < lp_length; i++) {
                load_path_options += ' --include ' + owl_cache.opal_load_paths[i];
            }
            // this implments Regexp.names, because that is missing in opal 0.11.0 and before
            // TODO remove Regexp.names once it is in opal
            child.execSync("bundle exec opal" + load_path_options + " -E -ce '" + "" +
                "require \"opal\";" +
                "require \"opal-platform\";" +
                "require \"opal/source_map\";" +
                "require \"source_map\";" +
                "require \"opal/paths\";" +
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

            // minify compiler, disabled in favour of saving time
            // var compiler_code = fs.readFileSync(owl_compiler_path);
            // var minified_compiler_result = UglifyJS.minify(compiler_code.toString());
            // fs.writeFileSync(owl_compiler_path, minified_compiler_result.code);
        }

    } else if (!Owl.cache_fetched) {
        // fetch cache
        var owl_cache_from_file = fs.readFileSync(owl_cache_path);
        owl_cache = JSON.parse(owl_cache_from_file.toString());
        Owl.paths = owl_cache.opal_load_paths;
        Owl.entries = owl_cache.opal_load_path_entries;
        Owl.cc_dir = owl_compiler_cache_dir;
        Owl.cache_fetched = true;
    }


    // load compiler
    if (typeof Opal === "undefined") {
        require(process.cwd() + '/' + owl_compiler_path);
        Opal.Opal.$append_paths.apply(Opal.Opal, Owl.paths);
    }

    // get additional options - ignored for now
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
    };

    compile_ruby(accumulator, source, this.resourcePath, null);

    // for debugging
    // fs.writeFileSync('owl_status.json', JSON.stringify(Owl));

    Owl.already_compiled = [];

    callback(null, accumulator.javascript, accumulator.source_map, meta);

    return;
};