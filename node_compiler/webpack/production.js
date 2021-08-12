// require requirements used below
const path = require('path');
const webpack = require('webpack');
const OwlResolver = require('opal-webpack-loader/resolver'); // to resolve ruby files
const ExtraWatchWebpackPlugin = require('extra-watch-webpack-plugin'); // to watch for added ruby files

const common_config = {
    target: 'node',
    context: path.resolve(__dirname, '../app'),
    mode: "development",
    optimization: {
        removeAvailableModules: false,
        removeEmptyChunks: false,
        minimize: false // dont minimize in development, to speed up hot reloads
    },
    performance: {
        maxAssetSize: 20000000,
        maxEntrypointSize: 20000000
    },
    devtool: false,
    output: {
        // webpack-dev-server keeps the output in memory
        filename: '[name].js',
        path: path.resolve(__dirname, '../public/assets'),
        publicPath: 'http://localhost:3036/assets/'
    },
    resolve: {
        plugins: [new OwlResolver('resolve', 'resolved') ], // this makes it possible for webpack to find ruby files
        alias: { 
            "react": "preact/compat"
        }
    },
    plugins: [
        // dont split ssr asset in chunks
        new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
        // watch for added files in opal dir
        new ExtraWatchWebpackPlugin({ dirs: [ path.resolve(__dirname, '../app') ] })
    ],
    module: {
        rules: [
            {
                test: /.(png|svg|jpg|gif|woff|woff2|eot|ttf|otf)$/,
                use: [ "file-loader" ]
            },
            {
                test: /(\.js)?\.rb$/,
                use: [
                    {
                        loader: 'opal-webpack-loader',
                        options: {
                            sourceMap: false,
                            hmr: false,
                            hmrHook: 'Opal.Isomorfeus.$force_render()'
                        }
                    }
                ]
            }
        ]
    },
    // configuration for webpack-dev-server
    devServer: {
        open: false,
        port: 3036,
        hot: false,
        https: false,
        allowedHosts: 'all',
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
        },
        static: {
            directory: path.resolve(__dirname, 'public'),
            watch: {
                // in case of problems with hot reloading uncomment the following two lines:
                // aggregateTimeout: 250,
                // poll: 50,
            ignored: /\bnode_modules\b/
            }
        },
        host: 'localhost'
    }
};

const ssr_config = {
    entry: { application_ssr: [path.resolve(__dirname, '../app/imports/application_ssr.js')] }
};

const ssr = Object.assign({}, common_config, ssr_config);

module.exports = ssr;
