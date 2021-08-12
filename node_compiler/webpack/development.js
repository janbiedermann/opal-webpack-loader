// require requirements used below
const path = require('path');
const webpack = require('webpack');
const OwlResolver = require('opal-webpack-loader/resolver'); // to resolve ruby files

module.exports = {
    target: 'node',
    entry: { node_opal_compiler: [path.resolve(__dirname, '../node_opal_compiler.js')] },
    context: path.resolve(__dirname, '../'),
    mode: "development",
    optimization: { minimize: false },
    performance: {
        maxAssetSize: 20000000,
        maxEntrypointSize: 20000000
    },
    devtool: false,
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, '../../'),
    },
    resolve: { plugins: [new OwlResolver('resolve', 'resolved') ] },
    module: {
        rules: [
            {
                test: /(\.js)?\.rb$/,
                use: [
                    {
                        loader: 'opal-webpack-loader',
                        options: {
                            sourceMap: false,
                            hmr: false,
                        }
                    }
                ]
            }
        ]
    }
};
