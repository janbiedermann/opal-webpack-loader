# opal-webpack-loader
Compile opal ruby projects nicely with webpack, without sprockets or webpacker gem.
Includes loader and resolver plugin.
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
- minimum webpack 4.8
- webpack-serve 2.0
- if you have webpacker gem installed somewhere, it should be a version supporting webpack 4
- ruby, version 2.5 or higher recommended
- bundler, latest version recommended
- Gemfile with at least: 
```
source 'https://rubygems.org'

gem 'opal', github: 'janbiedermann/opal', branch: 'es6_import_export' # requires this branch
gem 'opal-autoloader' # recommended
gem 'opal-webpack-loader'
```
- Gemfile.lock, created with bundle install or bundle update
### Helpful commands
Stopping the compile server: `echo 'command:stop' | nc -U .owl_cache/owcs_socket`

Deleting the load path cache: `rm .owl_cache/load_paths.json`
### Installation
#### of the accompanying NPM package:
one of:
```
npm i opal-webpack-loader --save-dev
yarn add opal-webpack-loader --dev
```
the gem
```
gem install opal-webpack-loader'
```
or add it to the Gemfile as above and `bundle install`
#### From the repo
clone repo, then `npm pack` in the repo and `npm i opal-webpack-loader-x.y.z.tgz --save`
### Example webpack configuration
for development:

webpack.config.js:
```
const path = require('path');
const webpack = require('webpack');
const Owl = require('opal-webpack-loader');
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
                test: /\.rb$/,
                use: [
                    'opal-webpack-loader'
                ]
            }
        ]
    }
        serve: {
            devMiddleware: {
                publicPath: '/pack/',
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                watchOptions: {
    
                }
            },
            hotClient: {
                host: 'localhost',
                port: 8081,
                allEntries: true,
                hmr: true
            },
            host: "localhost",
            port: 3035,
            logLevel: 'debug',
            content: path.resolve(__dirname, '../../public/packs'),
            clipboard: false,
            open: false,
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
    "start": "bundle exec opal-webpack-compile-server stop; bundle exec opal-webpack-compile-server && bundle exec webpack-serve --config webpack.config.js; bundle exec opal-webpack-compile-server stop",
    "build": "bundle exec opal-webpack-compile-server stop; bundle exec opal-webpack-compile-server && webpack --config=config/webpack/production.js; bundle exec opal-webpack-compile-server stop"
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
owl_include_tag('/packs/application.js')
```

#### Conventions
The webpack manifest is stored in `public/packs/manifest.json`.

Webpack must build the following packs for a `application.js` entry:

production: `application-[chunkhash].js`

development, using webpack serve: `http://localhost:3035//packs/application_development.js`

test: `application_test_[chunkhash].js`
