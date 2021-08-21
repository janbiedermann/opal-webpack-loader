'use strict';

const fs = require('fs');
const path = require('path');
const loaderUtils = require('loader-utils');

require('opal-webpack-loader/node_opal_compiler.js');

// keep some global state
let Owl = {
    load_paths_cache: null,
    load_paths: null,

    module_start: 'const opal_code = function() {\n  global.Opal.modules[',

    options: null,
    compiler_options: { es6_modules: true },

};

const default_options = {
    hmr: false,
    hmrHook: '',
    sourceMap: false,
    includePaths: null,
    requireModules: null,
    dynamicRequireSeverity: null,
    compilerFlagsOn: null,
    compilerFlagsOff: null,
    memcached: null,
    redis: null,
    load_paths_json: 'owl_load_paths.json'
};

function compile_in_node(that, callback, meta, filename, source, sourcemap) {
    let compiler_result = Opal.OpalWebpackLoader.NodeWorker.$compile(filename, source, sourcemap, Opal.Hash.$new(Object.assign({}, Owl.compiler_options, { file: filename })));
    if (typeof compiler_result.error !== 'undefined') {
        callback(new Error(compiler_result.error.name + "\n" +
            compiler_result.error.message + "\n" +
            compiler_result.error.backtrace
        ));
    } else {
        for (var i = 0; i < compiler_result.required_trees.length; i++) {
            that.addContextDependency(path.normalize(path.resolve(path.join(path.dirname(that.resourcePath)), compiler_result.required_trees[i])));
        }
        let result;
        let real_resource_path = path.normalize(that.resourcePath);
        if (Owl.options.hmr && real_resource_path.startsWith(path.normalize(that.rootContext))) {
            let hmreloader = create_hmreloader(compiler_result);
            result = [compiler_result.javascript, hmreloader].join("\n");
        } else { result = compiler_result.javascript; }
        callback(null, result, compiler_result.source_map, meta);
    }
}

function create_hmreloader(compiler_result) {
    // search for ruby module name in compiled file
    let start_index = compiler_result.javascript.indexOf(Owl.module_start) + Owl.module_start.length;
    let end_index = compiler_result.javascript.indexOf(']', start_index);
    let opal_module_name = compiler_result.javascript.substr(start_index, end_index - start_index);
    let hmreloader = `
if (module.hot) {
    if (typeof global.Opal !== 'undefined' && typeof Opal.require_table !== "undefined" && Opal.require_table['corelib/module']) {
        let already_loaded = false;
        if (typeof global.Opal.modules !== 'undefined') {
            if (typeof global.Opal.modules[${opal_module_name}] === 'function') {
                already_loaded = true;
            }
        }
        opal_code();
        if (already_loaded) {
            try {
                if (Opal.require_table[${opal_module_name}]) {
                    global.Opal.load.call(global.Opal, ${opal_module_name});
                } else {
                    global.Opal.require.call(global.Opal, ${opal_module_name});
                }
                ${Owl.options.hmrHook}
            } catch (err) {
                console.error(err.message);
            }
        } else {
            var start = new Date();
            var fun = function() {
                try {
                    if (Opal.require_table[${opal_module_name}]) {
                        global.Opal.load.call(global.Opal, ${opal_module_name});
                    } else {
                        global.Opal.require.call(global.Opal, ${opal_module_name});
                    }
                    console.log('${opal_module_name}: loaded');
                    try {
                        ${Owl.options.hmrHook}
                    } catch (err) {
                        console.error(err.message);
                    }
                } catch (err) {
                    if ((new Date() - start) > 10000) {
                        console.log('${opal_module_name}: load timed out');
                    } else {
                        console.log('${opal_module_name}: deferring load');
                        setTimeout(fun, 100);
                    }
                }
            }
            fun();
        }
    }
    module.hot.accept();
}`;
    return hmreloader;
}

function initialize_options(that) {
    const options = loaderUtils.getOptions(that);
    Object.keys(default_options).forEach(
        (key) => { if (typeof options[key] === 'undefined') options[key] = default_options[key]; }
    );
    if (!Owl.load_paths) {
        let json = fs.readFileSync(options.load_paths_json);
        let owl_cache = JSON.parse(json);
        Owl.load_paths = owl_cache.opal_load_paths;
        Opal.OpalWebpackLoader.NodeWorker.$init(Owl.load_paths);
    }
    return options;
}

module.exports = function(source, map, meta) {
    let callback = this.async();
    this.cacheable && this.cacheable();
    if (!Owl.options) { Owl.options = initialize_options(this); }
    compile_in_node(this, callback, meta, this.resourcePath, source, Owl.options.sourceMap);
    return undefined;
};
