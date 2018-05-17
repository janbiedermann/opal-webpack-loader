# opal-webpack-loader
Compile opal ruby projects nicely with webpack, without sprockets or webpacker gem.
### Requirements
- webpack 4.8
- ruby, version 2.5 or higher recommended
- bundler, latest version recommended
- Gemfile with at least: `gem 'opal'`, version 0.11 or higher
- Gemfile.lock, created with bundle install or bundle update
### Installation
#### From NPM
`npm i opal-webpack-loader --save`
#### From the repo
clone repo, then `npm pack` in the repo and `npm i opal-webpack-loader-x.y.z.tgz --save`
### Example configuration
Enables simple HMR
webpack.config.js:
```
module.exports = {
    optimization: {
        minimize: false
    },
    performance: {
        maxAssetSize: 20000000,
        maxEntrypointSize: 20000000
    },
    // currently works only with one of these:
    devtool: 'inline-source-map', // use this for correctness, disable for HMR, its slow
    // devtool: 'inline-cheap-source-map', // use this for faster builds, but less reliable, disable for HMR
    devServer: {
        hot: true,
        host: 'localhost',
        port: 8080,
        headers: {
            'Access-Control-Allow-Origin': '*'
        }
    },
    entry: {
        application: './app/assets/javascripts/application.js'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'public'),
        publicPath: 'http://localhost:8080/assets/'
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ],
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: [
                    'file-loader'
                ]
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/,
                use: [
                    'file-loader'
                ]
            },
            {
                test: /\.rb$/,
                use: [
                    'opal-webpack-loader'
                ]
            }
        ]
    }
};
```
app/assets/application.js:
```
global.React = require('react');
global.ReactDOM = require('react-dom');
global.History = require('history');
global.ReactRouter = require('react-router');
global.ReactRouterDOM = require('react-router-dom');
const ReactRailsUJS = require('react_ujs');
require('./ruby.rb');

if (module.hot) {
    module.hot.accept('./application.js', function() {
        console.log('Accepting the updated printMe module!');
        printMe();
    })
}
```