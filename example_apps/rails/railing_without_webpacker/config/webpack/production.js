const path = require('path');
const OwlResolver = require('opal-webpack-loader/resolver');
const CompressionPlugin = require("compression-webpack-plugin"); // for gzipping the packs
const ManifestPlugin = require('webpack-manifest-plugin');  // for generating the manifest
const TerserPlugin = require('terser-webpack-plugin');

const common_config = {
    context: path.resolve(__dirname, '../../app/opal'),
    mode: "production",
    optimization: {
        minimize: true, // minimize
        minimizer: [
            new TerserPlugin({
                cache: true
            })
        ]
    },
    performance: {
        maxAssetSize: 20000000,
        maxEntrypointSize: 20000000
    },
    output: {
        filename: '[name]-[chunkhash].js', // include fingerprint in file name, so browsers get the latest
        path: path.resolve(__dirname, '../../public/assets'),
        publicPath: '/assets/'
    },
    resolve: {
        plugins: [
            new OwlResolver('resolve', 'resolved') // resolve ruby files
        ]
    },
    plugins: [
        new CompressionPlugin({ test: /^((?!application_ssr).)*$/, cache: true }), // gzip compress, exclude application_ssr.js
        new ManifestPlugin({ fileName: 'manifest.json' }) // generate manifest
    ],
    module: {
        rules: [
            {
                test: /.scss$/,
                use: [
                    { loader: "cache-loader" },
                    {
                        loader: "style-loader",
                        options: {
                            hmr: false
                        }
                    },
                    {
                        loader: "css-loader",
                        options: {
                            sourceMap: false, // set to false to speed up hot reloads
                            minimize: true // set to false to speed up hot reloads
                        }
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            includePath: [path.resolve(__dirname, '../../app/assets/stylesheets')],
                            sourceMap: false // set to false to speed up hot reloads
                        }
                    }
                ]
            },
            {
                // loader for .css files
                test: /.css$/,
                use: [ "cache-loader", "style-loader", "css-loader" ]
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
                            sourceMap: false,
                            hmr: false
                        }
                    }
                ]
            }
        ]
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
