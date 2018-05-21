'use strict';

const fs = require('fs');
const child_process = require('child_process');
const net = require('net');
// const loaderUtils = require('loader-utils');
const md5 = require('js-md5');

// keep some global state
var Owl = {
    c_dir: '.owl_cache',
    cc_dir: '.owl_cache/cc',
    lp_cache: '.owl_cache/load_paths.json',
    socket: '.owl_cache/owcs_socket'
};

var warning = function(message) {
    Owl.emitWarning(new Error(message));
};

var error = function(message) {
    Owl.emitError(new Error(message));
};

function store_in_cache(filename, cache_obj) {
    var cache_key = md5(filename);
    var cc_fn = Owl.cc_dir + '/' + cache_key;
    var file_mtime = fs.statSync(filename).mtimeMs;
    cache_obj.mtime = file_mtime;
    fs.writeFileSync(cc_fn, JSON.stringify(cache_obj));
}

function fetched_from_cache(filename) {
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
        return cc;
    }
    return false;
}

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
            store_in_cache(filename, cresult);
            callback(null, cresult.javascript, cresult.source_map, meta);
        }
    });
    socket.on('error', function (err) {
        error("opal-webpack-loader: Can't communicate with compile server: %O", err);
        callback(err);
    });
}

function compile_ruby(source, filename, callback, meta) {
    // fetch from cache
    var result = fetched_from_cache(filename)

    if (!result) {

        if (!fs.existsSync(Owl.socket)) {
            // must start compile server
            var child = child_process.spawn('bundle', ['exec', 'opal-webpack-compile-server'], {detached: true, stdio: 'ignore'});
            child.unref();
            // wait for socket
            const timeout = setInterval(function() {
                if (fs.existsSync(Owl.socket)) {
                    clearInterval(timeout);
                    delegate_compilation(filename, callback, meta);
                }
            }, 100); // spawning a ruby process may takes around 800ms on my machine

        } else {
            delegate_compilation(filename, callback, meta);
        }


    } else {
        callback(null, result.javascript, result.source_map, meta);
    }
}

module.exports = function(source, map, meta) {
    var callback = this.async();
    this.cacheable && this.cacheable();
    Owl.emitWarning = this.emitWarning;
    Owl.emitError = this.emitError;

    var owl_cache_mtime = 0;
    var must_cleanup_cache = false;

    // TODO this is not necessary for every compilation
    try {
        fs.accessSync(Owl.lp_cache, fs.constants.R_OK | fs.constants.W_OK);
    } catch (err) {
        if (!fs.existsSync(Owl.c_dir)) { fs.mkdirSync(Owl.c_dir); }
        if (!fs.existsSync(Owl.cc_dir)) { fs.mkdirSync(Owl.cc_dir); }
        owl_cache_mtime = fs.statSync(Owl.lp_cache).mtimeMs;
        must_cleanup_cache = true;
    }

    var gemfile_mtime = fs.statSync('Gemfile').mtimeMs;
    var gemfile_lock_mtime = fs.statSync('Gemfile.lock').mtimeMs;

    if (owl_cache_mtime === 0) { owl_cache_mtime = fs.statSync(Owl.lp_cache).mtimeMs; }

    if (gemfile_mtime > gemfile_lock_mtime) { error("Gemfile is newer than Gemfile.lock, please run 'bundle install' or 'bundle update'!"); }
    if (gemfile_lock_mtime > owl_cache_mtime || must_cleanup_cache) {
        // clean up compiler cache
        var cc_entries = fs.readdirSync(Owl.cc_dir);
        var cce_length = cc_entries.length;
        for (var i = 0; i < cce_length; i++) {
            fs.unlinkSync(Owl.cc_dir + '/' + cc_entries[i]);
        }
        // kill compile server because compiler may have changed
        if (fs.existsSync(Owl.socket)) {
            var socket = net.connect(Owl.socket, function () {
                socket.write('command:kill\n');
            });
        }

    }

    // get additional options - ignored for now
    // const options = loaderUtils.getOptions(this);
    // for (var property in options) {
    //    if (options.hasOwnProperty(property)) {
    //        warning('options are: ' + property + ': ' + options[property]);
    //    }
    //}

    this.addDependency(this.resourcePath);
    compile_ruby(source, this.resourcePath, callback, meta);

    return;
};