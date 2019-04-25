'use strict';

const fs = require('fs');
const net = require('net');
const path = require('path');
const loaderUtils = require('loader-utils');

// keep some global state
let Owl = {
    c_dir: '.owl_cache',
    lp_cache: path.join('.owl_cache', 'load_paths.json'),
    socket: path.join('.owl_cache', 'owcs_socket'),
    options: null
};

function delegate_compilation(that, callback, meta) {
    let buffer = Buffer.alloc(0);
    let request_json = JSON.stringify({ filename: that.resourcePath, source_map: Owl.options.sourceMap });
    // or let the source be compiled by the compile server
    let socket = net.connect(Owl.socket, function () {
        socket.write(request_json + '\n'); // triggers compilation
    });
    socket.on('data', function (data) {
        buffer = Buffer.concat([buffer, data]);
    });
    socket.on('end', function() {
        let compiler_result = JSON.parse(buffer.toString());
        if (typeof compiler_result.error !== 'undefined') {
            that.emitError(new Error(compiler_result.error.backtrace));
            that.emitError(new Error(compiler_result.error.message));
            callback(new Error('opal-webpack-loader: A error occurred during compiling!'));
        } else {
            for (var i = 0; i < compiler_result.required_trees.length; i++) {
                that.addContextDependency(path.join(path.dirname(that.resourcePath), compiler_result.required_trees[i]));
            }
            let result;
            let real_resource_path = path.normalize(that.resourcePath);
            if (Owl.options.hmr && real_resource_path.startsWith(that.rootContext)) {
                // search for ruby module name in compiled file
                let start_index = compiler_result.javascript.indexOf('global.Opal.modules[') + 20; // 20 - length of the global... string
                let end_index = compiler_result.javascript.indexOf(']', start_index);
                let opal_module_name = compiler_result.javascript.substr(start_index, end_index - start_index);
                let hmreloader = `
if (module.hot) {
    let initially_loaded = false;
    if (typeof global.Opal !== 'undefined') {
        if (typeof global.Opal.modules !== 'undefined') {
            if (typeof global.Opal.modules[${opal_module_name}] === 'function') {
                initially_loaded = true;
            }
        }
    }
    if (initially_loaded) {
        module.hot.accept();
        opal_code();
        try {
            global.Opal.load.call(global.Opal, ${opal_module_name});
            ${Owl.options.hmrHook}
        } catch (err) {
            console.error(err.message);
        }
    }
}`;
                result = [compiler_result.javascript, hmreloader].join("\n");
            } else { result = compiler_result.javascript; }
            callback(null, result, compiler_result.source_map, meta);
        }
    });
    socket.on('error', function (err) {
        callback(err);
    });
}

function compile_ruby(source, that, callback, meta) {
    if (!fs.existsSync(Owl.socket)) {
        callback(new Error('opal-webpack-loader: opal-webpack-compile-server not running, please start opal-webpack-compile-server'));
    } else {
        delegate_compilation(that, callback, meta);
    }
}

module.exports = function(source, map, meta) {
    let callback = this.async();
    this.cacheable && this.cacheable();
    if (!Owl.options) {
        Owl.options = loaderUtils.getOptions(this);
        if (typeof Owl.options.hmr === 'undefined' ) { Owl.options.hmr = false; }
        if (typeof Owl.options.hmrHook === 'undefined' ) { Owl.options.hmrHook = ''; }
        if (typeof Owl.options.sourceMap === 'undefined' ) { Owl.options.sourceMap = false; }
    }
    // this.addDependency(this.resourcePath);
    compile_ruby(source, this, callback, meta);
};
