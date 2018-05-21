# opal-webpack-loader
Compile opal ruby projects nicely with webpack, without sprockets or webpacker gem.
### Requirements
- webpack 4.8
- ruby, version 2.5 or higher recommended
- bundler, latest version recommended
- Gemfile with at least: 
```
source 'https://rubygems.org'
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

ruby '2.5.1'

# for opal
gem 'opal', github: 'janbiedermann/opal', branch: 'es6_import_export'
gem 'opal-webpack-compile-server', '0.0.2'

# for hyperloop
gem 'hyper-component', github: 'janbiedermann/hyper-component', branch: 'pinata'
gem 'hyper-mesh', github: 'janbiedermann/hyper-mesh', branch: 'pinata'
gem 'hyper-model', github: 'janbiedermann/hyper-model', branch: 'pinata'
gem 'hyper-operation', github: 'janbiedermann/hyper-operation', branch: 'pinata'
gem 'hyper-react', github: 'janbiedermann/hyper-react', branch: 'pinata'
gem 'hyper-router', github: 'janbiedermann/hyper-router', branch: 'pinata'
gem 'hyper-store', github: 'janbiedermann/hyper-store', branch: 'pinata'
gem 'hyperloop', github: 'janbiedermann/hyperloop', branch: 'pinata'
gem 'hyperloop-config', github: 'janbiedermann/hyperloop-config', branch: 'pinata'
```
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
const path = require('path');
const webpack = require('webpack');
const OpalWebpackResolverPlugin = require('opal-webpack-resolver-plugin');

module.exports = {
    mode: "development",
    optimization: {
        minimize: false
    },
    performance: {
        maxAssetSize: 20000000,
        maxEntrypointSize: 20000000
    },
    // devtool: 'cheap-eval-source-map',
    // devtool: 'inline-source-map',
    // devtool: 'inline-cheap-source-map',
    devServer: {
        disableHostCheck: true,
        hot: true,
        host: 'localhost',
        port: 8080,
        public: 'localhost:8080',
        publicPath: 'http://localhost:8080/assets/',
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
        // new webpack.ProvidePlugin({'Opal': 'corelib/runtime.js'}),
        new webpack.HotModuleReplacementPlugin()
    ],
    resolve: {
        plugins: [
            new OpalWebpackResolverPlugin('resolve', 'resolved')
        ]
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
app/assets/javascripts/application.js:
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
app/assets/javascripts/ruby.rb
```
require 'opal'
require 'browser' # CLIENT ONLY
require 'browser/delay' # CLIENT ONLY
require 'hyperloop-config'
require 'hyperloop/autoloader'
require 'hyperloop/autoloader_starter'
require 'reactrb/auto-import'
require 'hyper-component'
require 'hyper-react'
require 'hyper-model'
require 'hyper-store'
require 'hyper-operation'
require 'hyper-router'
require 'hyperloop_webpack_loader'

puts "Loaded!!"
```
app/hyperloop/hyperloop_webpack_loader.rb
```
require_tree 'stores'
require_tree 'models'
require_tree 'operations'
require_tree 'components'
```