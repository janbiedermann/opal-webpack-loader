'use strict';

const child = require('child_process');
const fs = require('fs');
const loaderUtils = require('loader-utils')

module.exports = function(source, map, meta) {
    var self = this;
    var warning = function(message) {
        self.emitWarning(new Error(message));
    }
    var error = function(message) {
        self.emitError(new Error(message));
    }

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

    if (owl_cache_mtime == 0) { owl_cache_mtime = fs.statSync(owl_cache_path).mtimeMs; }

    // warning('Gemfile mtime: ' + gemfile_mtime);
    // warning('Gemfile.lock mtime: ' + gemfile_lock_mtime);
    // warning('owl cache mtime: ' + owl_cache_mtime);

    if (gemfile_mtime > gemfile_lock_mtime) { error("Gemfile is newer than Gemfile.lock, please run 'bundle install' or 'bundle update'!"); }
    if (gemfile_lock_mtime > owl_cache_mtime || must_generate_cache) {
        // generate cache
        // warning('Generating Opal load path cache:');
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
            crl_length = child_result_lines.length;
        }
        // for (var i = 0; i < crl_length; i++) {
        //     warning('found Opal load path: ' + child_result_lines[i]);
        // }
        owl_cache.opal_load_paths = child_result_lines;
        fs.writeFileSync(owl_cache_path, JSON.stringify(owl_cache));
    } else {
        var owl_cache_from_file = fs.readFileSync(owl_cache_path);
        owl_cache = JSON.parse(owl_cache_from_file.toString());
        // warning('Reading Opal load path cache:');
        var ocl_length = owl_cache.opal_load_paths.length;
        if (owl_cache.opal_load_paths[ocl_length-1] === '' || owl_cache.opal_load_paths[ocl_length-1] == null) {
            owl_cache.opal_load_paths = owl_cache.opal_load_paths.pop();
            ocl_length = owl_cache.opal_load_paths.length;
        }
        // for (var i = 0; i < ocl_length; i++) {
        //     warning('found Opal load path: ' + owl_cache.opal_load_paths[i]);
        // }
    }

    // load or compile and cache compiler
    if (gemfile_lock_mtime > owl_cache_mtime || must_generate_cache || !fs.existsSync(owl_compiler_path)) {
        if (fs.existsSync('bin/rails')) {
            child_result = child.execSync('bundle exec rails runner "puts \\\$LOAD_PATH; exit 0"');
        } else {
            child_result = child.execSync('bundle exec ruby -e "Bundler.require; puts \\\$LOAD_PATH; exit 0"');
        }
        // warning(child_result);
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
        // warning(load_path_options);
        child.execSync("bundle exec opal" + load_path_options + " -E -ce 'require \"opal\";require \"opal-platform\";require \"hike\";require \"opal/source_map\";require \"opal/builder\";require \"opal/builder_processors\";require \"nodejs\"' > " + owl_compiler_path);
        require(process.cwd() + '/' + owl_compiler_path);
    } else {
        if (typeof Opal === "undefined") {
            require(process.cwd() + '/' + owl_compiler_path);
        }
    }

    // warning('Opal Platform ' + Opal.OPAL_PLATFORM);
    // get additional options

    const options = loaderUtils.getOptions(this);
    for (var property in options) {
        if (options.hasOwnProperty(property)) {
            warning('options are: ' + property + ': ' + options[property]);
        }
    }

    // for (var property in this) {
    //     if (this.hasOwnProperty(property)) {
    //         if (typeof this[property] === 'function') {
    //             warning('this are function: ' + property);
    //         } else {
    //             warning('this are: ' + property + ': ' + this[property]);
    //         }
    //     }
    // }

    // compile the source

    var builder = Opal.Opal.$const_get('Builder').$new();
    builder.$append_paths.apply(builder, owl_cache.opal_load_paths);

    builder.$build_str(source, this.resourcePath);

    // warning(builder.$requires());

    var compiled_source = builder.$to_s();

    if (this.sourceMap) {
        // generate source map
        // warning('Generating source map');
        map = builder.$source_map();
    } else {
        // compile without source map
        // warning('NOT generating source map');
    }
    // var requires = builder.$processed().$requires();
    // var r_length = requires.length;
    // for (var i = 0; i < r_length; i++) {
    //     warning('needs require: ' + requires[i]);
    // }
    result += compiled_source;
    callback(null, result, map, meta);
    return;
};