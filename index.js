'use strict';

const fs = require('fs');
const net = require('net');

// keep some global state
var Owl = {
    c_dir: '.owl_cache',
    lp_cache: '.owl_cache/load_paths.json',
    socket: '.owl_cache/owcs_socket'
};

var error = function(message) {
    Owl.emitError(new Error(message));
};

function delegate_compilation(filename, callback, meta) {
    var buffer = Buffer.alloc(0);
    // or let the source be compiled by the compile server
    var socket = net.connect(Owl.socket, function () {
        socket.write(filename + '\n'); // triggers compilation
    });
    socket.on('data', function (data) {
        buffer = Buffer.concat([buffer, data]);
    });
    socket.on('end', function() {
        var cresult = JSON.parse(buffer.toString());
        if (typeof cresult.error !== 'undefined') {
            error(cresult.error.backtrace);
            error(cresult.error.message);
            callback(new Error('opal-webpack-loader: A error occured during compiling!', filename));
        } else {
            callback(null, cresult.javascript, cresult.source_map, meta);
        }
    });
    socket.on('error', function (err) {
        callback(err);
    });
}

function compile_ruby(source, filename, callback, meta) {
    if (!fs.existsSync(Owl.socket)) {
        callback(new Error('opal-webpack-loader: opal-webpack-compile-server not running, please start opal-webpack-compile-server'));
    } else {
        delegate_compilation(filename, callback, meta);
    }
}

module.exports = function(source, map, meta) {
    var callback = this.async();
    this.cacheable && this.cacheable();
    Owl.emitError = this.emitError;

    this.addDependency(this.resourcePath);
    compile_ruby(source, this.resourcePath, callback, meta);

    return;
};

exports.resolver = class OpalWebpackResolverPlugin {
    constructor(source, target) {
        const gemfile_path = 'Gemfile';
        const gemfile_lock_path = 'Gemfile.lock';
        const owl_cache_path = '.owl_cache/load_paths.json';

        if (!this.owl_cache_fetched) {
            var owl_cache_from_file = fs.readFileSync(owl_cache_path);
            var owl_cache = JSON.parse(owl_cache_from_file.toString());
            this.opal_load_paths = owl_cache.opal_load_paths;
            this.opal_load_path_entries = owl_cache.opal_load_path_entries;
            this.owl_cache_fetched = true;
        }

        this.source = source;
        this.target = target;
    }

    apply(resolver) {
        const target = resolver.ensureHook(this.target);
        resolver.getHook(this.source).tapAsync("OpalWebpackResolverPlugin", (request, resolveContext, callback) => {
            if (request.request.endsWith('.rb') || request.request.endsWith('.js')) {
                var absolute_path = this.get_absolute_path(request.path, request.request);
                if (absolute_path) {
                    var result = Object.assign({}, request, {path: absolute_path});
                    resolver.doResolve(target, result, "opal-webpack-resolver-plugin found: " + absolute_path, resolveContext, callback);
                } else {
                    // continue pipeline
                    return callback();
                }
            } else {
                // continue pipeline
                return callback();
            }
        });
    }

    is_file(path) {
        return fs.statSync(path).isFile();
    }

    get_absolute_path(path, request) {
        var logical_filename_rb;
        var logical_filename_js;
        var absolute_filename;
        var module;

        // cleanup request, comes like './module.rb', we want '/module.rb'
        if (request.startsWith('./')) {
            module = request.slice(1);
        } else if (request.startsWith('/')) {
            module = request;
        } else {
            module = '/' + request;
        }

        // opal allows for require of
        // .rb, .js, .js.rb, look up all of them
        if (module.endsWith('.rb')) {
            logical_filename_rb = module;
            logical_filename_js = module.slice(0,module.length-2) + 'js';
        } else if (module.endsWith('.js')) {
            logical_filename_rb = module + '.rb';
            logical_filename_js = module;
        }

        var l = this.opal_load_paths.length;

        // in general, to avoid conflicts, we need to lookup .rb first, once all .rb
        // possibilities are checked, check .js
        // try .rb
        // look up known entries
        for (var i = 0; i < l; i++) {

            absolute_filename = this.opal_load_paths[i] + logical_filename_rb;
            if (this.opal_load_path_entries.includes(absolute_filename)) {
                // check if file exists?
                if (fs.existsSync(absolute_filename) && this.is_file(absolute_filename)) {
                    return absolute_filename;
                }
            }
        }

        // look up file system of app
        for (var i = 0; i < l; i++) {
            if (this.opal_load_paths[i].startsWith(process.cwd())) {
                absolute_filename = this.opal_load_paths[i] + logical_filename_rb;
                if (fs.existsSync(absolute_filename) && this.is_file(absolute_filename)) {
                    return absolute_filename;
                }
            }
        }

        // check current path
        absolute_filename = path + logical_filename_rb;
        if (absolute_filename.startsWith(process.cwd())) {
            if (fs.existsSync(absolute_filename) && this.is_file(absolute_filename)) {
                return absolute_filename;
            }
        }

        // try .js
        // look up known entries
        for (var i = 0; i < l; i++) {
            absolute_filename = this.opal_load_paths[i] + logical_filename_js;
            if (this.opal_load_path_entries.includes(absolute_filename)) {
                // check if file exists?
                if (fs.existsSync(absolute_filename) && this.is_file(absolute_filename)) {
                    return absolute_filename;
                }
            }
        }

        // look up file system of app
        for (var i = 0; i < l; i++) {
            if (this.opal_load_paths[i].startsWith(process.cwd())) {
                absolute_filename = this.opal_load_paths[i] + logical_filename_js;
                if (fs.existsSync(absolute_filename) && this.is_file(absolute_filename)) {
                    return absolute_filename;
                }
            }
        }
        return null;
    }
};