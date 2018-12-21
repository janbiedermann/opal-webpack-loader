# opal-webpack-loader
Compile opal ruby projects nicely with webpack, without sprockets or webpacker gem.
Includes a loader and resolver plugin for webpack.
### Chat
https://gitter.im/isomorfeus/Lobby
### Features
- webpack based build process
- very fast builds of opal code
- builds are asynchronous and even parallel, depending on how webpack triggers builds
- opal modules are packaged as es6 modules
- other webpack features become available, like:
- tree shaking
- code splitting
- lazy loading
### Requirements
- webpack 4.28
- webpack-dev-server 3.1.10
- es6_import_export branch of opal
- if you have webpacker gem installed somewhere, it should be a version supporting webpack 4
- ruby, version 2.5 or higher recommended
- bundler, latest version recommended

### Installation
#### Install the accompanying NPM package:
one of:
```bash
npm i opal-webpack-loader --save-dev
yarn add opal-webpack-loader --dev
```
#### install the gems
```bash
gem install opal-webpack-loader
```
or add it to the Gemfile as below and `bundle install`
```ruby
source 'https://rubygems.org'

gem 'opal', github: 'janbiedermann/opal', branch: 'es6_import_export' # requires this branch
gem 'opal-autoloader' # recommended
gem 'opal-webpack-loader'
```
### View Helper
in Rails or frameworks that support `javscript_include_tag`, in your app/helpers/application_helper.rb
```ruby
module ApplicationHelper
  include OpalWebpackLoader::RailsViewHelper
```
in other frameworks that dont have a `javascript_include_tag`:
```ruby
module ApplicationHelper
  include OpalWebpackLoader::ViewHelper
```

Then you can use in your views:
```ruby
owl_script_tag('application.js')
```

#### Project configuration options for the view helper
```ruby
OpalWebpackLoader.use_manifest = false
```
If the manifest file should be used, use_manifest should be true.
```ruby
OpalWebpackLoader.manifest_path = File.join(Dir.getwd, 'public', 'packs', 'manifest.json')
```
Sets the path to the webpack (with the [webpack-manifest-plugin](https://www.npmjs.com/package/webpack-manifest-plugin)) generated manifest.json to look up assets.
```ruby
OpalWebpackLoader.client_asset_path = 'http://localhost:3035/packs/'
```
The path to prepend to the assets as configured in the webpack config 'publicPath'. 
In the config example below its `publicPath: 'http://localhost:3025/packs'` so
client_asset_path should be set to the same.

For **production** use with readily precompiled and compressed assets which contain a fingerprint in the name (webpacks [chunkhash]),
and if the path in the manifest is the full path to the asset as configured in webpack,
these settings would work:
```ruby
OpalWebpackLoader.use_manifest = true
OpalWebpackLoader.manifest_path = File.join(Dir.getwd, 'public', 'packs', 'manifest.json')
OpalWebpackLoader.client_asset_path = ''
```

For **development** use with webpack-dev-server, with no manifest, these settings would work:
```ruby
OpalWebpackLoader.use_manifest = false
OpalWebpackLoader.manifest_path = File.join(Dir.getwd, 'public', 'packs', 'manifest.json') # doesn't matter, not used
OpalWebpackLoader.client_asset_path = 'http://localhost:3035/packs/'
```
### Example Applications
Example applications can be generated with the isomorfeus installer. See the isomorfeus-framework project at [isomorfeus.com](http://isomorfeus.com).
### Example webpack configuration
for development:

webpack.config.js:
```javascript
const path = require('path');
const webpack = require('webpack');
const OwlResolver = require('opal-webpack-loader/resolver');

module.exports = {
    mode: "development",
    optimization: {
        minimize: false
    },
    performance: {
        maxAssetSize: 20000000,
        maxEntrypointSize: 20000000
    },
    devtool: 'source-map'
    // devtool: 'cheap-eval-source-map',
    // devtool: 'inline-source-map',
    // devtool: 'inline-cheap-source-map',
    entry: {
        application: './app/javascript/application.js'
    },
    output: {
        filename: '[name]_development.js',
        // for porduction: '[name]-[chunkhash].js'
        // for test: '[name]_test_[chunkhash].js'
        path: path.resolve(__dirname, 'public/packs'),
        publicPath: 'http://localhost:3035/packs'
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ],
    resolve: {
        plugins: [
            new OwlResolver('resolve', 'resolved')
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
                // opal-webpack-loader will compile and include ruby files in the pack
                test: /.(rb|js.rb)$/,
                use: [
                    {
                        loader: 'opal-webpack-loader',
                        options: {
                            // set sourceMap to false to improve performance
                            sourceMap: true
                        }
                    }
                ]
            }
        ]
    },
    // configuration for webpack-dev-server
    devServer: {
        open: false,
        lazy: false,
        port: 3035,
        hot: true,
        // hotOnly: true,
        inline: true,
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
        contentBase: path.resolve(__dirname, 'public')
        // watchContentBase: true
    }
};
```
app/javascript/application.js:
```javascript
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as History from 'history';
import * as ReactRouter from 'react-router';
import * as ReactRouterDOM from 'react-router-dom';
import * as ReactRailsUJS from 'react_ujs';

global.React = React;
global.ReactDOM = ReactDOM;
global.History = History;
global.ReactRouter = ReactRouter;
global.ReactRouterDOM = ReactRouterDOM;
global.ReactRailsUJS = ReactRailsUJS;

import ruby_code from './ruby_code.rb';
ruby_code();
Opal.load('ruby_code');

if (module.hot) {
    module.hot.accept('./application.js', function() {
        console.log('Accepting the updated application.js module!');
        printMe();
    })
}
```
app/assets/javascripts/ruby_code.rb
```ruby
require 'opal'
require 'opal-autoloader'

puts "Ruby Code Loaded!!"
```
package.json needs to start the opal compile server:
```json
  "scripts": {
    "start": "bundle exec opal-webpack-compile-server start webpack-dev-server --config development.js",
    "build": "bundle exec opal-webpack-compile-server start webpack --config=production.js"
  },
```
