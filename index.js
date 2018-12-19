'use strict';

const fs = require('fs');
const net = require('net');
const loaderUtils = require('loader-utils');

// keep some global state
var Owl = {
    c_dir: '.owl_cache',
    lp_cache: '.owl_cache/load_paths.json',
    socket: '.owl_cache/owcs_socket',
    options: null
};

var error = function(message) {
    Owl.emitError(new Error(message));
};

function delegate_compilation(filename, callback, meta) {
    var buffer = Buffer.alloc(0);
    var request_json = JSON.stringify({ filename: filename, source_map: Owl.options.sourceMap });
    // or let the source be compiled by the compile server
    var socket = net.connect(Owl.socket, function () {
        socket.write(request_json + '\n'); // triggers compilation
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
    Owl.options = loaderUtils.getOptions(this);

    this.addDependency(this.resourcePath);
    compile_ruby(source, this.resourcePath, callback, meta);

    return;
};
