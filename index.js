'use strict';

const child_process = require('child_process');
const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');
const process = require('process');
const loaderUtils = require('loader-utils');

// keep some global state
let Owl = {
    load_paths_cache: null,
    socket_path: null,
    module_start: 'const opal_code = function() {\n  global.Opal.modules[',
    compile_server_starting: false,
    socket_ready: false,
    options: null,
    socket_wait_counter: 0,
    is_stopping: false
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
};

function handle_exit() {
    if (!Owl.is_stopping) {
        Owl.is_stopping = true;
        try { fs.unlinkSync(Owl.load_paths_cache); } catch (err) { }
        try {
            if (fs.existsSync(Owl.socket_path)) {
                // this doesnt seem to return, so anything below it is not executed
                child_process.spawnSync("bundle", ["exec", "opal-webpack-compile-server", "stop", "-s", Owl.socket_path], {timeout: 10000});
            }
        } catch (err) { }
        try { fs.unlinkSync(Owl.socket_path); } catch (err) { }
        try { fs.rmdirSync(process.env.OWL_TMPDIR); } catch (err) { }
    }
}
process.on('exit', function(code) { handle_exit(); });
process.on('SIGTERM', function(signal) { handle_exit(); });

function delegate_compilation(that, callback, meta, request_json) {
    let buffer = Buffer.alloc(0);
    // or let the source be compiled by the compile server
    let socket = net.connect(Owl.socket_path, function () {
        socket.write(request_json + "\x04"); // triggers compilation
    });
    socket.on('data', function (data) {
        buffer = Buffer.concat([buffer, data]);
    });
    socket.on('end', function() {
        let compiler_result = JSON.parse(buffer.toString('utf8'));
        if (typeof compiler_result.error !== 'undefined') {
            callback(new Error(
                "opal-webpack-loader: A error occurred during compiling!\n" +
                compiler_result.error.name + "\n" +
                compiler_result.error.message + "\n" +
                compiler_result.error.backtrace
            ));
        } else {
            for (var i = 0; i < compiler_result.required_trees.length; i++) {
                that.addContextDependency(path.join(path.dirname(that.resourcePath), compiler_result.required_trees[i]));
            }
            let result;
            let real_resource_path = path.normalize(that.resourcePath);
            if (Owl.options.hmr && real_resource_path.startsWith(that.rootContext)) {
                // search for ruby module name in compiled file
                let start_index = compiler_result.javascript.indexOf(Owl.module_start) + Owl.module_start.length;
                let end_index = compiler_result.javascript.indexOf(']', start_index);
                let opal_module_name = compiler_result.javascript.substr(start_index, end_index - start_index);
                let hmreloader = `
if (module.hot) {
    let already_loaded = false;
    if (typeof global.Opal !== 'undefined' && typeof global.Opal.modules !== 'undefined') {
        if (typeof global.Opal.modules[${opal_module_name}] === 'function') {
            already_loaded = true;
        }
    }
    module.hot.accept();
    opal_code();
    if (already_loaded) {
        try {
            global.Opal.load.call(global.Opal, ${opal_module_name});
            ${Owl.options.hmrHook}
        } catch (err) {
            console.error(err.message);
        }
    } else {
        var start = new Date();
        var fun = function() {
            try {
                global.Opal.load.call(global.Opal, ${opal_module_name});
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
}`;
                result = [compiler_result.javascript, hmreloader].join("\n");
            } else { result = compiler_result.javascript; }
            callback(null, result, compiler_result.source_map, meta);
        }
    });
    socket.on('error', function (err) {
        // only with webpack-dev-server running, somehow connecting to the IPC sockets leads to ECONNREFUSED
        // even though the socket is alive. this happens every once in a while for some seconds
        // not sure why this happens, but looping here solves it after a while
        // console.log("connect error for ", that.resourcePath)
        if (err.syscall === 'connect') {
            setTimeout(function() {
                delegate_compilation(that, callback, meta, request_json);
            }, 100);
        } else { callback(err); }
    });
}

function wait_for_socket_and_delegate(that, callback, meta, request_json) {
    if (Owl.socket_ready) {
        delegate_compilation(that, callback, meta, request_json);
    } else if (fs.existsSync(Owl.socket_path)) {
        Owl.socket_ready = true;
        delegate_compilation(that, callback, meta, request_json);
    } else {
        setTimeout(function() {
            if (Owl.socket_wait_counter > 600) { throw new Error('opal-webpack-loader: Unable to connect to compile server!'); }
            wait_for_socket_and_delegate(that, callback, meta, request_json);
        }, 50);
    }
}

function start_compile_server() {
    Owl.socket_path = path.join(process.env.OWL_TMPDIR, 'owcs_socket');
    if (!fs.existsSync(Owl.socket_path)) {
        Owl.compile_server_starting = true;
        Owl.load_paths_cache = path.join(process.env.OWL_TMPDIR, 'load_paths.json');
        let options = ["exec", "opal-webpack-compile-server", "start", os.cpus().length.toString(), "-l", Owl.load_paths_cache, "-s", Owl.socket_path];

        if (Owl.options.dynamicRequireSeverity) options.push('-d', Owl.options.dynamicRequireSeverity);

        (Owl.options.includePaths || []).forEach((path) => options.push('-I', path));
        (Owl.options.requireModules || []).forEach((requiredModule) => options.push('-r', requiredModule));
        (Owl.options.compilerFlagsOn || []).forEach((flagOn) => options.push('-t', flagOn));
        (Owl.options.compilerFlagsOff || []).forEach((flagOff) => options.push('-f', flagOff));

        let compile_server = child_process.spawn("bundle", options, { detached: true, stdio: 'ignore' });
        compile_server.unref();
    } else {
        throw(new Error("opal-webpack-loader: compile server socket in use by another process"));
    }
}

function initialize_options(that) {
    const options = loaderUtils.getOptions(that);
    Object.keys(default_options).forEach(
        (key) => { if (typeof options[key] === 'undefined') options[key] = default_options[key]; }
    )
    return options;
}

module.exports = function(source, map, meta) {
    let callback = this.async();
    this.cacheable && this.cacheable();
    if (!Owl.options) { Owl.options = initialize_options(this); }
    if (!Owl.socket_ready && !Owl.compile_server_starting) { start_compile_server(); }
    let request_json = JSON.stringify({ filename: this.resourcePath, source_map: Owl.options.sourceMap });
    wait_for_socket_and_delegate(this, callback, meta, request_json);
};
