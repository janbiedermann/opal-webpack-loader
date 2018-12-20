# opal-webpack-loader
Compile opal ruby projects nicely with webpack, without sprockets or webpacker gem.
Includes a loader and resolver plugin for webpack.
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
### Helpful commands
Stopping the compile server: `bundle exec opal-webpack-compil-server stop`

Deleting the load path cache: `rm .owl_cache/load_paths.json`
### Installation
#### Install the accompanying NPM package:
one of:
```
npm i opal-webpack-loader --save-dev
yarn add opal-webpack-loader --dev
```
#### install the gems
```
gem install opal-webpack-loader'
```
or add it to the Gemfile as below and `bundle install`
```
source 'https://rubygems.org'

gem 'opal', github: 'janbiedermann/opal', branch: 'es6_import_export' # requires this branch
gem 'opal-autoloader' # recommended
gem 'opal-webpack-loader'
```
#### Install NPM package from the repo
clone repo, then `npm pack` in the repo and `npm i opal-webpack-loader-x.y.z.tgz --save`
### Example webpack configuration
for development:

webpack.config.js:
```
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
        publicPath: 'http://localhost:8080/packs'
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
    }
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
```
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
        console.log('Accepting the updated printMe module!');
        printMe();
    })
}
```
app/assets/javascripts/ruby_code.rb
```
require 'opal'
require 'opal-autoloader'

puts "Ruby Code Loaded!!"
```
package.json needs to start the opal compile server before webpack:
```
  "scripts": {
    "start": "bundle exec opal-webpack-compile-server start webpack-dev-server --config development.js",
    "build": "bundle exec opal-webpack-compile-server start webpack --config=production.js"
  },
```
### View Helper
in rails or frameworks that support `javscript_include_tag`, in your app/helpers/application_helper.rb
``` 
module ApplicationHelper
  include OpalWebpackLoader::RailsViewHelper
```
in other frameworks that dont have `javascript_include_tag`:
``` 
module ApplicationHelper
  include OpalWebpackLoader::ViewHelper
```

Then you can use in your views:
```
owl_include_tag('application.js')
```

#### Project configuration options for the view helpers
```ruby
OpalWebpackLoader.manifest_path = File.join(Dir.getwd, 'public', 'packs', 'manifest.json')
```
sets the path to the webpack generated manifest.json to look up assets
```
OpalWebpackLoader.client_asset_path = '/packs'
```
The path to prepend to the assets as configured in the webpack config 'publicPath'. 
In the example above its `publicPath: 'http://localhost:8080/packs'` so
client_asset_path should be set to '/packs'