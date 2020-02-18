'use strict';

const child_process = require('child_process');
const crypto = require('crypto');
const node_fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');
const process = require('process');
const JsTransformer = require("metro/src/JSTransformer/worker");
const MemcachePlus = require('memcache-plus');

// keep some global state
let Owl = {
    load_paths_cache: null,
    socket_path: null,
    compile_server_starting: false,
    socket_ready: false,
    options: null,
    socket_wait_counter: 0,
    is_stopping: false,
    memcache_client: null
};

const default_options = {
    sourceMap: false,
    includePaths: null,
    requireModules: null,
    dynamicRequireSeverity: null,
    compilerFlagsOn: null,
    compilerFlagsOff: null,
    memcached: null
};

function handle_exit() {
    if (!Owl.is_stopping) {
        Owl.is_stopping = true;
        try { node_fs.unlinkSync(Owl.load_paths_cache); } catch (err) { }
        try {
            if (node_fs.existsSync(Owl.socket_path)) {
                // this doesnt seem to return, so anything below it is not executed
                child_process.spawnSync("bundle", ["exec", "opal-webpack-compile-server", "stop", "-s", Owl.socket_path], {timeout: 10000});
            }
        } catch (err) { }
        try { node_fs.unlinkSync(Owl.socket_path); } catch (err) { }
        try { node_fs.rmdirSync(process.env.OWL_TMPDIR); } catch (err) { }
    }
}
process.on('exit', function(code) { handle_exit(); });
process.on('SIGTERM', function(signal) { handle_exit(); });

class RubyTransformer {
    _config;
    _projectRoot;

    constructor(projectRoot, config) {
        this._projectRoot = projectRoot;
        this._config = config;
        this._upstreamTransfomer = new JsTransformer(projectRoot, config);
        if (!Owl.options) {
            Owl.options = this.initialize_options({});
        }
    }

    async transform(filename, data, options) {
        if (filename.endsWith('.rb')) {
            if (!Owl.socket_ready && !Owl.compile_server_starting) { await this.start_compile_server(); }
            let memcache_result;
            let memcache_key;
            if (Owl.options.memcached) {
                if (!Owl.memcache_client) { start_memcache_client(); }
                // TODO use async version readFile
                let source = node_fs.readFileSync(filename, { encoding: 'utf-8', flag: 'r' });
                memcache_key = this.compute_digest(source);
                memcache_result = await Owl.memcache_client.get(memcache_key);
            }
            if (memcache_result) { data = Buffer.from(memcache_result, 'utf-8'); }
            else {
                let request_json = JSON.stringify({filename: filename, source_map: Owl.options.sourceMap});
                let compiled_code = await this.wait_for_socket_and_delegate(request_json, memcache_key);
                data = Buffer.from(compiled_code, 'utf-8');
            }
        }
        return this._upstreamTransfomer.transform(filename, data, options);
    }

    getCacheKey() {
        return this._upstreamTransfomer.getCacheKey();
    }

    compute_digest(source) {
        const hash = crypto.createHash('sha1');
        hash.update(source, 'utf-8');
        return hash.digest().toString('base64');
    }

    async delegate_compilation(request_json, memcache_key) {
        return new Promise((resolve, reject) => {
            let buffer = Buffer.alloc(0);
            // or let the source be compiled by the compile server
            let socket = net.connect(Owl.socket_path, function () {
                socket.write(request_json + "\x04"); // triggers compilation
            });
            socket.on('data', function (data) {
                buffer = Buffer.concat([buffer, data]);
            });
            socket.on('end', function () {
                let compiler_result = JSON.parse(buffer.toString('utf8'));
                if (typeof compiler_result.error !== 'undefined') {
                    throw new Error(
                        "opal-metro-transformer: A error occurred during compiling!\n" +
                        compiler_result.error.name + "\n" +
                        compiler_result.error.message + "\n" +
                        compiler_result.error.backtrace // that's ruby error.backtrace
                    );
                } else {
                    if (memcache_key) {
                        // we set source map too for compatibility with owl loader to ensure the same cache can be shared
                        Owl.memcache_client.set(memcache_key, { javascript: compiler_result.javascript, source_map: compiler_result.source_map })
                    }
                    resolve(compiler_result.javascript);
                }
            });
            socket.on('error', function (err) {
                // only with webpack-dev-server running, somehow connecting to the IPC sockets leads to ECONNREFUSED
                // even though the socket is alive. this happens every once in a while for some seconds
                // not sure why this happens, but looping here solves it after a while
                if (err.syscall === 'connect') {
                    setTimeout(function () {
                        this.delegate_compilation(request_json, memcache_key).then(result => { resolve(result); });
                    }, 100);
                } else {
                    reject(err);
                }
            });
        });
    }

    initialize_options(options) {
        Object.keys(default_options).forEach(
            (key) => { if (typeof options[key] === 'undefined') options[key] = default_options[key]; }
        );
        return options;
    }

    async start_compile_server() {
        Owl.socket_path = path.join(process.env.OWL_TMPDIR, 'owcs_socket');
        if (!node_fs.existsSync(Owl.socket_path)) {
            Owl.compile_server_starting = true;
            console.log('---->  Opal Ruby Compile Server starting  <----');
            Owl.load_paths_cache = path.join(process.env.OWL_TMPDIR, 'load_paths.json');
            let command_args = ["exec", "opal-webpack-compile-server", "start", os.cpus().length.toString(), "-l", Owl.load_paths_cache, "-s", Owl.socket_path];

            if (Owl.options.dynamicRequireSeverity) command_args.push('-d', Owl.options.dynamicRequireSeverity);

            (Owl.options.includePaths || []).forEach((path) => command_args.push('-I', path));
            (Owl.options.requireModules || []).forEach((requiredModule) => command_args.push('-r', requiredModule));
            (Owl.options.compilerFlagsOn || []).forEach((flagOn) => command_args.push('-t', flagOn));
            (Owl.options.compilerFlagsOff || []).forEach((flagOff) => command_args.push('-f', flagOff));

            let compile_server = child_process.spawn("bundle", command_args, { detached: true, stdio: 'ignore' });
            compile_server.unref();
        } else {
            Owl.socket_ready = true;
            // throw(new Error("opal-metro-transformer: compile server socket in use by another process"));
        }
    }

    start_memcache_client() {
        if (typeof Owl.options.memcached === 'string' || Array.isArray(Owl.options.memcached)) {
            Owl.memcache_client = new MemcachePlus(Owl.options.memcached);
        } else {
            Owl.memcache_client = new MemcachePlus();
        }
    }

    async wait_for_socket_and_delegate(request_json, memcache_key) {
        if (Owl.socket_ready) {
            return this.delegate_compilation(request_json, memcache_key);
        } else if (node_fs.existsSync(Owl.socket_path)) {
            Owl.socket_ready = true;
            return this.delegate_compilation(request_json, memcache_key);
        } else {
            let that = this;
            return new Promise((resolve, reject) => {
                setTimeout(function () {
                    if (Owl.socket_wait_counter > 600) {
                        throw new Error('opal-webpack-loader: Unable to connect to compile server!');
                    }
                    that.wait_for_socket_and_delegate(request_json, memcache_key).then(result => {
                        resolve(result);
                    });
                }, 50);
            })
        }
    }
}

module.exports = RubyTransformer;
