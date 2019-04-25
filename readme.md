# opal-webpack-loader
Bundle assets with webpack, resolve and compile opal ruby files and import them in the bundle, without sprockets or the webpacker gem
 (but can be used with both of them too).
Includes a loader and resolver plugin for webpack.

### Community and Support
At the [Isomorfeus Framework Project](http://isomorfeus.com) 

### Features
- comes with a installer for rails and other frameworks
- webpack based build process
- very fast builds of opal code
- builds are asynchronous and even parallel, depending on how webpack triggers builds
- opal modules are packaged as es6 modules
- other webpack features become available, like:
- source maps
- hot module reloading
- tree shaking
- code splitting
- lazy loading

### Requirements
- webpack 4.30
- webpack-dev-server 3.3.0
- es6_import_export branch of opal [PR#1832](https://github.com/opal/opal/pull/1832)
- if you have webpacker gem installed somewhere, it should be a version supporting webpack 4
- ruby, version 2.5 or higher recommended
- bundler, latest version recommended

### Installation

#### Using the installer
First install the gem:
```
gem install 'opal-webpack-loader'
```
##### Install for Rails like projects
If you start a new rails project, the following options are recommended for `rails new`: `--skip-sprockets --skip-javascript`

Then within the projects root directory execute:
```bash
owl-install rails
```
If you have the webpacker gem installed, you need to merge the configuration in the config/webpacker directory.
A example for config/webpack/development.js is in the
[templates](https://github.com/isomorfeus/opal-webpack-loader/blob/master/lib/opal-webpack-loader/templates/webpacker_development.js_example).

Please see the messages of owl-install. You may need to manually add the following gems to the projects Gemfile:
```ruby
gem 'opal', github: 'janbiedermann/opal', branch: 'es6_import_export'
gem 'opal-webpack-loader', '~> 0.6.0'
```

Then:
```bash
yarn install
bundle install
```
Opal ruby files should then go in the newly created `app/opal` directory. With the option -o the directory can be named differently, for example:
```bash
owl-install rails -o hyperhyper
```
A directory `app/hyperhyper` will be created, opal files should then go there and will be properly resolved by webpack.

Complete 
```
project_root
    +- app
        +- assets
            +- javascripts  # javascript entries directory
            +- styles       # directory for stylesheets
        +- opal             # directory for opal application files, can be changed with -o
    +- config
        +- webpack          # directory for webpack configuration files
        +- initializers
            +- opal_webpack_loader.rb  # initializer for owl
    +- package.json         # package config for npm/yarn and their scripts
    +- public
        +- assets           # directory for compiled output files
    +- Procfile             # config file for foreman
```
              
##### Install for Cuba, Roda, Sinatra and others with a flat structure
```bash
owl-install flat
```

Please see the message of owl-install. You may need to manually add the following gems to the projects Gemfile:
```ruby
gem 'opal', github: 'janbiedermann/opal', branch: 'es6_import_export'
gem 'opal-webpack-loader', '~> 0.5.1'
```

Then:
```bash
yarn install
bundle install
```
Also make sure to require the owl initializer, e.g. `require './owl_init'`, in your projects startup file.
Opal ruby files should then go in the newly created `opal` directory. With the option -o the directory can be named differently, for example:
```bash
owl-install rails -o supersuper
```
A directory `supersuper` will be created, opal files should then go there and will be properly resolved by webpack.

Complete set of directories and files created by the installer for projects with a flat structure:
```
project_root
    +- owl_init.rb      # initializer for owl
    +- javascripts      # javascript entries directory
    +- opal             # directory for opal application files, can be changed with -o
    +- package.json     # package config for npm/yarn and their scripts
    +- public
        +- assets       # directory for compiled output files
    +- styles           # directory for stylesheets
    +- webpack          # directory for webpack configuration files
    +- Procfile         # config file for foreman
```

#### Manual installation
##### Install the accompanying NPM package:
one of:
```bash
npm i opal-webpack-loader --save-dev
yarn add opal-webpack-loader --dev
```
##### Install the gems
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
##### Install config
See the [configuration templates](https://github.com/isomorfeus/opal-webpack-loader/tree/master/lib/opal-webpack-loader/templates)
and adjust to your preference.

### Source Maps

#### Source Map Demo
[![SourceMap Demo](https://img.youtube.com/vi/SCmDYu_MLQU/0.jpg)](https://www.youtube.com/watch?v=SCmDYu_MLQU)

#### Source Map configuration

The opal-webpack-loader for webpack supports the following options to enable HMR:
(These are option for the webpack config, not to be confused with the owl ruby project options further down below)
```javascript
    loader: 'opal-webpack-loader',
    options: {
        sourceMap: true
    }
```

- `sourceMap` : enable (`true`) or disable (`false`) source maps. Optional, default: `false`

Also source maps must be enabled in webpack. See [webpack devtool configuration](https://webpack.js.org/configuration/devtool).
### Hot Module Reloading

#### HMR Demo

[![HMR Demo](https://img.youtube.com/vi/igF3cUsZrAQ/0.jpg)](https://www.youtube.com/watch?v=igF3cUsZrAQ)

(Recommended to watch in FullHD)

#### HMR Configuration

The opal-webpack-loader for webpack supports the following options to enable HMR:
(These are option for the webpack config, not to be confused with the owl ruby project options further down below)
```javascript
    loader: 'opal-webpack-loader',
    options: {
        hmr: true,
        hmrHook: 'global.Opal.ViewJS["$force_update!"]();'
    }
```

- `hmr` : enable (`true`) or disable (`false`) hot module reloading. Optional, default: `false`
- `hmrHook` : A javascript expression as string which will be executed after the new code has been loaded.
Useful to trigger a render or update for React or ViewJS projects.

Note 1: HMR works only for files within the project tree. Files outside the project tree are not hot reloaded.

Note 2: When adding a opal ruby file, currently a manual page reload is required for webpack to pick it up. Once its loaded once,
webpack will hot reload it from then on. ([issue#1](https://github.com/isomorfeus/opal-webpack-loader/issues/1))

### Opal Load Path
The projects directory for opal ruby files must be in the opal load path. This is done in the initializer for rails apps or in the app_loader.rb,
for example:
```ruby
Opal.append_path(File.realdirpath('app/opal'))
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
#### Compile Server and app_loader.rb
For non rails projects, determining Opal load paths, for the resolver and compile server to work properly, may not be obvious. For these cases
a file `app_loader.rb` in the projects root can be created which just loads all requirements without starting anything.
Usually it would just setup bundler with the appropriate options, for example:
```ruby
require 'bundler/setup'
if ENV['MY_PROJECT_ENV'] && ENV['MY_PROJECT_ENV'] == 'test'
  Bundler.require(:default, :test)
elsif ENV['MY_PROJECT_ENV'] && ENV['MY_PROJECT_ENV'] == 'production'
  Bundler.require(:default, :production)
else
  Bundler.require(:default, :development)
end
```
When this file exists, the compile server will load it and generate Opal load paths accordingly for the resolver.

#### Project configuration options for the view helper
```ruby
OpalWebpackLoader.use_manifest = false
```
If the manifest file should be used, use_manifest should be true.
```ruby
OpalWebpackLoader.manifest_path = File.join(Dir.getwd, 'public', 'assets', 'manifest.json')
```
Sets the path to the webpack (with the [webpack-manifest-plugin](https://www.npmjs.com/package/webpack-manifest-plugin)) generated manifest.json to look up assets.
```ruby
OpalWebpackLoader.client_asset_path = 'http://localhost:3035/assets/'
```
The path to prepend to the assets as configured in the webpack config 'publicPath'. 
In the config example below its `publicPath: 'http://localhost:3025/assets'` so
client_asset_path should be set to the same.

For **production** use with readily precompiled and compressed assets which contain a fingerprint in the name (webpacks [chunkhash]),
and if the path in the manifest is the full path to the asset as configured in webpack,
these settings would work:
```ruby
OpalWebpackLoader.use_manifest = true
OpalWebpackLoader.manifest_path = File.join(Dir.getwd, 'public', 'assets', 'manifest.json')
OpalWebpackLoader.client_asset_path = ''
```

For **development** use with webpack-dev-server, with no manifest, these settings would work:
```ruby
OpalWebpackLoader.use_manifest = false
OpalWebpackLoader.manifest_path = File.join(Dir.getwd, 'public', 'assets', 'manifest.json') # doesn't matter, not used
OpalWebpackLoader.client_asset_path = 'http://localhost:3035/assets/'
```
### Example webpack configuration
See the [configuration templates](https://github.com/isomorfeus/opal-webpack-loader/tree/master/lib/opal-webpack-loader/templates).
