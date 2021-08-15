// require requirements used below
const path = require('path');
const OwlResolver = require('opal-webpack-loader/resolver'); // to resolve ruby files

module.exports = {
    target: 'node',
    entry: { node_opal_compiler: [path.resolve(__dirname, '..', 'node_opal_compiler.js')] },
    context: path.resolve(__dirname, '..'),
    mode: "production",
    optimization: { minimize: true },
    performance: {
        maxAssetSize: 20000000,
        maxEntrypointSize: 20000000
    },
    devtool: false,
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, '..', '..'),
    },
    resolve: { plugins: [
        new OwlResolver('resolve', 'resolved', [], {
            load_paths_json: path.resolve(__dirname, '..', 'owl_load_paths.json')
        }) 
    ]},
    module: {
        rules: [
            {
                test: /(\.js)?\.rb$/,
                use: [
                    {
                        loader: 'thread-loader',
                        options: {
                            workers: 4
                        }  
                    },
                    {
                        loader: 'opal-webpack-loader',
                        options: {
                            sourceMap: false,
                            hmr: false,
                            load_paths_json: path.resolve(__dirname, '..', 'owl_load_paths.json'),
                        }
                    }
                ]
            }
        ]
    }
};
