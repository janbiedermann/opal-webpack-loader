# opal-webpack-loader
Bundle assets with webpack, resolve and compile opal ruby files and import them in the bundle, without sprockets or the webpacker gem
 (but can be used with both of them too).
Includes a loader and resolver plugin for webpack.

### Community and Support
At the [Isomorfeus Framework Project](http://isomorfeus.com) 

### Features
- comes with a installer for rails and other frameworks
- webpack based build process
- very fast, asynchronous and parallel builds of opal code:
opal-webpack-loader-0.7.1 compiles all of opal, a bunch of gems and over 19000SLC on a
Intel® Core™ i7-7700HQ CPU @ 2.80GHz × 8, with 8 workers in around 1850ms
- opal modules are packaged as es6 modules
- other webpack features become available, like:
  - source maps
  - multiple targets: web (for browsers), node (for server side rendering) and webworker (for Web Workers)
  - hot module reloading for opal ruby code and stylesheets and html views
  - tree shaking
  - code splitting
  - lazy loading
  - everything else webpack can do, like loading stylesheets, etc.

### Requirements
- opal-webpack-loader consists of 2 parts, the npm package and the gem, both are required
- webpack 4.30
- webpack-dev-server 3.3.0
- one of the ES6 modules branches of opal
  - [PR#1832](https://github.com/opal/opal/pull/1832),
    - implementing ES6 modules, based on Opal master 1.0.beta,
    
      `gem 'opal', github: 'janbiedermann/opal', branch: 'es6_import_export'`
      
    - implementing ES6 modules, based on Opal 0.11.1.dev
    
      `gem 'opal', github: 'janbiedermann/opal', branch: 'es6_import_export', ref: 'e3fdf16e8a657f7d9f9507207848a34953dced8d'`
      
  - [PR#1970](https://github.com/opal/opal/pull/1969), implementing ES6 modules and changes for 'strict' mode,
    based on Opal master 1.0.beta using javascript string primitives
    
    `gem 'opal', github: 'janbiedermann/opal', branch: 'es6_modules'`
    
  - [PR#1973](https://github.com/opal/opal/pull/1973), implementing ES6 modules and changes for 'strict' mode,
    based on Opal master 1.0.beta using javascript string objects by default for all strings
    
    `gem 'opal', github: 'janbiedermann/opal', branch: 'es6_modules_string'`
    
- if you have the webpacker gem installed somewhere, it should be a version supporting webpack 4
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
gem 'opal-webpack-loader', '~> 0.6.2' # use the most recent released version here
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

Complete set of directories and files created by the installer for projects with a rails like structure:
```
project_root
    +- app
        +- assets
            +- javascripts  # javascript entries directory
                +- application.js
                +- application_common.js
                +- application_ssr.js
                +- application_webworker.js
            +- styles       # directory for stylesheets
        +- opal             # directory for opal application files, can be changed with -o
    +- config
        +- webpack          # directory for webpack configuration files
            +- debug.js
            +- development.js
            +- production.js
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
The installer produces a `app_loader.rb` which `require './owl_init'`. `app_loader.rb` is used by the compile server to correctly determine opal load
paths. It should be required by `config.ru`.
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
        +- application.js
        +- application_common.js
        +- application_ssr.js
        +- application_webworker.js
    +- opal             # directory for opal application files, can be changed with -o
    +- package.json     # package config for npm/yarn and their scripts
    +- public
        +- assets       # directory for compiled output files
    +- styles           # directory for stylesheets
    +- webpack          # directory for webpack configuration files
        +- debug.js
        +- development.js
        +- production.js
    +- Procfile         # config file for foreman
```

#### Manual Installation
##### Install the accompanying NPM package:
one of:
```bash
npm i opal-webpack-loader
yarn add opal-webpack-loader
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
##### Install the configuration
See the [configuration templates](https://github.com/isomorfeus/opal-webpack-loader/tree/master/lib/opal-webpack-loader/templates)
and adjust to your preference.

### General Usage

After installing owl with the installer, three scripts are provided in package.json:
- `development` - runs the webpack-dev-server, use for general development, provides fast reloads, entry is application.js
- `debug` - runs the webpack-dev-server, use for debugging, provides source maps, entry is application_debug.js. Additional debugging tools may be added there.
- `production_build` - runs webpack to build assets for production, entry is application.js

These scripts can for example be run with:
`yarn run debug` or `npm run debug`

The default config provides several targets and entries:

- **Browser**: the webpack target is 'web' and the javascript entry file for imports is `application.js` - general use for the application with all
browser features, the opal ruby entry file is `opal_loader.rb` in the opal or app/opal directory of the app.
- **Server Side Rendering**: the webpack target is `node` and the javascript entry file for imports is `application_ssr.js` - general use for the
application server side rendering, several Browser features are unavailable, no `window`, no `document`, some node features are available,
like `Buffer`, the opal ruby entry file is `opal_loader.rb` in the opal or app/opal directory of the app.
(meant to be used with isomorfeus-speednode, standard ExecJS limitations prevent certain webpack features)
- **Web Worker**: the webpack target is 'webworker' and the javascript entry file for imports is `application_webworker.js` - used to initialize Web
Workers in the browser, the opal ruby entry file is `opal_webworker_loader.rb` in the opal or app/opal directory of the app.

Only the browser target is build by default. To builds the other target, just add the needed targets to the last line of the webpack config,
for example to `development.js`:
default config:
```javascript
module.exports = [ browser ];
```
modified config with ssr and web_worker targets enabled:
```javascript
module.exports = [ browser, ssr, web_worker ];
```
Same works for the `debug.js` and `production.js` webpack config files.

Also a Procfile has been installed, for rails its easy to startup rails and webpack with foreman:
`foreman start` (`gem install foreman` if you dont have it already). It will start rails and webpack-dev-server with the development script.

For non rails installation check the Procfile and add a starter for your app.

#### Opal Ruby Application Files
For rails installations with the installer they all go into: `app/opal`, for flat installations in the `opal` directory.
In this directory there already is a `opal_loader.rb` which is the entry point for your app.

#### Stylesheets
Stylesheets are hot reloaded too with the default config installed by the installer. Also they are imported into application.js by default.
For rails like applications stylesheets are in `app/assets/stylesheets/application.css`, for flat applications they are in `styles/application.css`.
SCSS is supported too by the default config.

#### Views
For rails like applications a watcher for `app/views` is installed by default. The watcher will trigger a page reload when views are changed.
For flat applications nothing is configured by default, as there are to many ways to generate views, they are not even needed with
frameworks like isomorfeus. Instead the section for configuring a view watcher is included in the development.js and debug.js webpack
config, but it is commented out. Please see those files and adjust to your liking.

#### Parallel compilation for speed
For speed the number of workers for compiling opal ruby files can be adjusted in `package.json` -> "scripts" key:
Default entries look like:
`"production_build": "bundle exec opal-webpack-compile-server start 4 webpack --config=config/webpack/production.js"`
The compile server will start 4 workers for compiling opal files. The recommended number of workers should be 4 for machines with 4 or less cores,
or equal to the number of cores, for machines with up to 12 cores. More than 12 can't be kept busy by webpack it seems, ymmv.
Example for 8 cores:
`"production_build": "bundle exec opal-webpack-compile-server start 8 webpack --config=config/webpack/production.js"`
### Source Maps

#### Source Map Demo
[![SourceMap Demo](https://img.youtube.com/vi/SCmDYu_MLQU/0.jpg)](https://www.youtube.com/watch?v=SCmDYu_MLQU)

It shows a exception during a page load. In the console tab of the browsers developer tools, the error message is then expanded and just by clicking
on the shown file:line_numer link, the browser shows the ruby source code, where the exception occured.

#### Source Map Configuration

The opal-webpack-loader for webpack supports the following options to enable HMR:
(These are options for the webpack config, not to be confused with the owl ruby project options further down below)
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

#### HMR and Ruby

When a module uses method aliasing and is reloaded, the aliases are applied again, which may lead to a endless recursion of method calls of
the aliased method once called after hot reloading.
To prevent that, the alias should be conditional, only be applied if the alias has not been applied before. Or alternatively the original
method must be restored before aliasing it again.
Because gems are not hot reloaded, this is not a issue for imported gems, but must be taken care of within the projects code.

Also it must be considered, that other code, which without hot reloading would only execute once during the programs life cycle, possibly will
execute many times when hot reloaded. "initialization code" should be guarded to prevent it from executing many times.

#### HMR Configuration

The opal-webpack-loader for webpack supports the following options to enable HMR:
(These are options for the webpack config, not to be confused with the owl ruby project options further down below)
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

Note: HMR works only for files within the project tree. Files outside the project tree are not hot reloaded.

### Opal Load Path
The projects directory for opal ruby files must be in the opal load path. This is done in the initializer for rails apps in
config/initializers/opal_webpack_loader.rb or in 'owl_init.rb' for non rails apps, for example:
```ruby
Opal.append_path(File.realdirpath('app/opal'))
```

### View Helper
In Rails or frameworks that support `javscript_include_tag`, add to the app/helpers/application_helper.rb
```ruby
module ApplicationHelper
  include OpalWebpackLoader::RailsViewHelper
```
in other frameworks that dont have a `javascript_include_tag`:
```ruby
module MyProjectsViewThings
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
require './owl_init.rb' # this is a good place to require the opal-webpack-loader initializer, to get the apps opal load path
```
When this file exists, the compile server will load it and generate Opal load paths accordingly for the resolver.

#### Project configuration options for the view helper
These setting are in the initializer in config/initializers/opal_webpack_loader.rb for rails like apps, or owl_init.rb for others.
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
