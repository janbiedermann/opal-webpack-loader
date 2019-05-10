'use strict';

const fs = require('fs');
const path = require('path');

module.exports = class Resolver {
    constructor(source, target) {
        const owl_cache_path = path.join('.owl_cache', 'load_paths.json');

        if (!this.owl_cache_fetched) {
            let owl_cache_from_file = fs.readFileSync(owl_cache_path);
            let owl_cache = JSON.parse(owl_cache_from_file.toString());
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
                let absolute_path = this.get_absolute_path(request.path, request.request);
                if (absolute_path) {
                    let result = Object.assign({}, request, {path: absolute_path});
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
        let logical_filename_rb;
        let logical_filename_js;
        let absolute_filename;
        let module;

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

        let l = this.opal_load_paths.length;

        // in general, to avoid conflicts, we need to lookup .rb first, once all .rb
        // possibilities are checked, check .js
        // try .rb
        // look up known entries
        for (let i = 0; i < l; i++) {
            absolute_filename = this.opal_load_paths[i] + logical_filename_rb;
            if (this.opal_load_path_entries.includes(absolute_filename)) {
                // check if file exists?
                if (fs.existsSync(absolute_filename) && this.is_file(absolute_filename)) {
                    return absolute_filename;
                }
            }
        }

        // look up file system of app
        for (let i = 0; i < l; i++) {
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
        for (let i = 0; i < l; i++) {
            absolute_filename = this.opal_load_paths[i] + logical_filename_js;
            if (this.opal_load_path_entries.includes(absolute_filename)) {
                // check if file exists?
                if (fs.existsSync(absolute_filename) && this.is_file(absolute_filename)) {
                    return absolute_filename;
                }
            }
        }

        // look up file system of app
        for (let i = 0; i < l; i++) {
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