# opal-webpack-loader
Requirements:
- webpack 4.8
- ruby installed, version 2.5 or higher recommended
- bundler installed, latest version recommended
- Gemfile with at least: `gem 'opal'`, version 0.11 or higher
- Gemfile.lock, create with bundle install or bundle update

example webpack.config.js:
```
module.exports = {
    optimization: {
        minimize: false
    },
    performance: {
        maxAssetSize: 20000000,
        maxEntrypointSize: 20000000
    },
    devtool: 'inline-source-map',
    devServer: {
        contentBase: './public'
    },
    entry: {
        application: './app/assets/javascripts/application.js'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'public')
    },
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
and in your app/assets/application.js, for example:
```
global.React = require('react');
global.ReactDOM = require('react-dom');
global.History = require('history');
global.ReactRouter = require('react-router');
global.ReactRouterDOM = require('react-router-dom');
const ReactRailsUJS = require('react_ujs');
require('./ruby.rb');
```