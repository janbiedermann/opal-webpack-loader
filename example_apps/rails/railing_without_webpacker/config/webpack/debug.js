// require requirements used below
const path = require('path');
const webpack = require('webpack');
const chokidar = require('chokidar');
const OwlResolver = require('opal-webpack-loader/resolver'); // to resolve ruby files
const ExtraWatchWebpackPlugin = require('extra-watch-webpack-plugin'); // to watch for added ruby files

const common_config = {
    context: path.resolve(__dirname, '../../app/opal'),
    mode: "development",
    optimization: {
        minimize: false // dont minimize for debugging
    },
    performance: {
        maxAssetSize: 20000000,
        maxEntrypointSize: 20000000
    },
    // use one of these below for source maps
    devtool: 'source-map', // this works well, good compromise between accuracy and performance
    // devtool: 'cheap-eval-source-map', // less accurate
    // devtool: 'inline-source-map', // slowest
    // devtool: 'inline-cheap-source-map',
    output: {
        // webpack-dev-server keeps the output in memory
        filename: '[name].js',
        path: path.resolve(__dirname, '../../public/assets'),
        publicPath: 'http://localhost:3035/assets/'
    },
    resolve: {
        plugins: [
            // this makes it possible for webpack to find ruby files
            new OwlResolver('resolve', 'resolved')
        ],
        alias: {
            'react-dom': 'react-dom/profiling',
            'schedule/tracing': 'schedule/tracing-profiling',
        }
    },
    plugins: [
        // both for hot reloading
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        // watch for added files in opal dir
        new ExtraWatchWebpackPlugin({
            dirs: [ path.resolve(__dirname, '../../app/opal') ]
        })
    ],
    module: {
        rules: [
            {
                // loader for .scss files
                // test means "test for for file endings"
                test: /.scss$/,
                use: [
                    { loader: "cache-loader" },
                    {
                        loader: "style-loader",
                        options: {
                            hmr: true
                        }
                    },
                    {
                        loader: "css-loader",
                        options: {
                            sourceMap: true // set to false to speed up hot reloads
                        }
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            includePaths: [path.resolve(__dirname, '../../app/assets/stylesheets')],
                            sourceMap: true // set to false to speed up hot reloads
                        }
                    }
                ]
            },
            {
                // loader for .css files
                test: /.css$/,
                use: [
                    { loader: "cache-loader" },
                    {
                        loader: "style-loader",
                        options: {
                            hmr: true
                        }
                    },
                    {
                        loader: "css-loader",
                        options: {
                            sourceMap: true // set to false to speed up hot reloads
                        }
                    }
                ]
            },
            {
                test: /.(png|svg|jpg|gif|woff|woff2|eot|ttf|otf)$/,
                use: [ "cache-loader", "file-loader" ]
            },
            {
                // opal-webpack-loader will compile and include ruby files in the pack
                test: /(\.js)?\.rb$/,
                use: [
                    { loader: "cache-loader" },
                    {
                        loader: 'opal-webpack-loader',
                        options: {
                            sourceMap: true,
                            hmr: true,
                            hmrHook: ''
                        }
                    }
                ]
            }
        ]
    },
    // configuration for webpack-dev-server
    devServer: {
        // enable page reload for updates within the app/views directory
before: function(app, server) {
    chokidar.watch(path.resolve(__dirname, path.join('..', '..', 'app', 'views'))).on('all', function () {
        server.sockWrite(server.sockets, 'content-changed');
    })
},

        open: false,
        lazy: false,
        port: 3035,
        hot: true,
        // hotOnly: true,
        inline: true,
        https: false,
        disableHostCheck: true,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
        },
        watchOptions: {
            // in case of problems with hot reloading uncomment the following two lines:
            // aggregateTimeout: 250,
            // poll: 50,
            ignored: /\bnode_modules\b/
        },
        contentBase: path.resolve(__dirname, 'public'),
        // watchContentBase: true,
        // writeToDisk: true, // TODO this may need to be activated for ssr to work in development
        useLocalIp: false
    }
};

const browser_config = {
    target: 'web',
    entry: {
        application: [path.resolve(__dirname, '../../app/assets/javascripts/application.js')]
    }
};

const ssr_config = {
    target: 'node',
    entry: {
        application_ssr: [path.resolve(__dirname, '../../app/assets/javascripts/application_ssr.js')]
    }
};

const web_worker_config = {
    target: 'webworker',
    entry: {
        web_worker: [path.resolve(__dirname, '../../app/assets/javascripts/application_web_worker.js')]
    }
};

const browser = Object.assign({}, common_config, browser_config);
const ssr = Object.assign({}, common_config, ssr_config);
const web_worker = Object.assign({}, common_config, web_worker_config);

module.exports = [ browser ];
