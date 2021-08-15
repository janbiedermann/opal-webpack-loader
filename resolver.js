'use strict';

const fs = require('fs');
const pathmod = require('path');
const process = require('process');

module.exports = class Resolver {
    constructor(source, target, filter = [], options) {
        if (!this.opal_load_paths) {
            let json = fs.readFileSync(options.load_paths_json);
            let owl_cache = JSON.parse(json);
            this.opal_load_paths = owl_cache.opal_load_paths;
            this.opal_load_path_entries = owl_cache.opal_load_path_entries;
        }
        this.source = source;
        this.target = target;
    }

    apply(resolver) {
        const target = resolver.ensureHook(this.target);
        resolver.getHook(this.source).tapAsync("OpalWebpackResolverPlugin", (request, resolveContext, callback) => {
            if (request.request.endsWith('.rb') || request.request.endsWith('.js')) {
                let absolute_path = this.get_absolute_path(request.path, request.request);
                if (absolute_path) {
                    let result = Object.assign({}, request, {path: pathmod.normalize(absolute_path)});
                    resolver.doResolve(target, result, null, resolveContext, callback);
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
        try { return fs.statSync(path).isFile(); }
        catch { return false; }
    }

    get_absolute_path(path, request) {
        let logical_filename_rb;
        let logical_filename_js;
        let absolute_filename;
        let module;

        // cleanup request, comes like './module.rb', we want '/module.rb'
        if (request.startsWith('./')) {
            module = request.slice(1);
        } else if (request.startsWith('/')) {
            module = request;
        } else if (request.match(/^[A-Za-z]+\:[\\/]/)) {
            module = request.replace(/\\/g,'/');
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

        let l = this.opal_load_paths.length;

        // check absolute path if in Windows
        if (request.match(/^[A-Za-z]+\:[\\/]/)) {
            if (this.is_file(logical_filename_rb)) { return logical_filename_rb; }
            else if (this.is_file(logical_filename_js)) { return logical_filename_js; }
        }

        // in general, to avoid conflicts, we need to lookup .rb first, once all .rb
        // possibilities are checked, check .js
        // try .rb
        // look up known entries
        for (let i = 0; i < l; i++) {
            absolute_filename = this.opal_load_paths[i] + logical_filename_rb;
            if (this.opal_load_path_entries.includes(absolute_filename)) {
                // check if file exists?
                if (this.is_file(absolute_filename)) {
                    return absolute_filename;
                }
            }
        }

        // look up file system of app
        for (let i = 0; i < l; i++) {
            if (this.opal_load_paths[i].startsWith(process.cwd().replace(/\\/g,'/'))) {
                absolute_filename = this.opal_load_paths[i] + logical_filename_rb;
                if (this.is_file(absolute_filename)) {
                    return absolute_filename;
                }
            }
        }

        // check current path
        absolute_filename = path + logical_filename_rb;
        if (absolute_filename.startsWith(process.cwd().replace(/\\/g,'/'))) {
            if (this.is_file(absolute_filename)) {
                return absolute_filename;
            }
        }

        // try .js
        // look up known entries
        for (let i = 0; i < l; i++) {
            absolute_filename = this.opal_load_paths[i] + logical_filename_js;
            if (this.opal_load_path_entries.includes(absolute_filename)) {
                // check if file exists?
                if (this.is_file(absolute_filename)) {
                    return absolute_filename;
                }
            }
        }

        // look up file system of app
        for (let i = 0; i < l; i++) {
            if (this.opal_load_paths[i].startsWith(process.cwd().replace(/\\/g,'/'))) {
                absolute_filename = this.opal_load_paths[i] + logical_filename_js;
                if (this.is_file(absolute_filename)) {
                    return absolute_filename;
                }
            }
        }

        // nothing found
        return null;
    }
};
