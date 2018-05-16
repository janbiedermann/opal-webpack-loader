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
app/assets/application.js:
```
global.React = require('react');
global.ReactDOM = require('react-dom');
global.History = require('history');
global.ReactRouter = require('react-router');
global.ReactRouterDOM = require('react-router-dom');
const ReactRailsUJS = require('react_ujs');
require('./ruby.rb');
```