<h1 align="center">
  <img src="https://raw.githubusercontent.com/isomorfeus/opal-webpack-loader/master/docs/owl.png" 
  align="center" title="Opal logo by Elia Schito combined with Webpack Logo" width="111" height="125" />
  <br/>
  opal-webpack-loader<br/>
  <img src="https://img.shields.io/badge/Opal-Ruby%20💛%20JavaScript%20💛%20Webpack-yellow.svg?logo=ruby&style=social&logoColor=777"/>
</h1>

Bundle assets with webpack, resolve and compile opal ruby files and import them in the bundle, without sprockets or the webpacker gem
 (but can be used with both of them too).
Includes a loader and resolver plugin for webpack.

### Community and Support
At the [Isomorfeus Framework Project](http://isomorfeus.com) 

### Tested
[TravisCI](https://travis-ci.org): [![Build Status](https://travis-ci.org/isomorfeus/opal-webpack-loader.svg?branch=master)](https://travis-ci.org/isomorfeus/opal-webpack-loader)

### Features
- comes with a installer for rails and other frameworks
- webpack based build process
- very fast, asynchronous and parallel builds of opal code:
opal-webpack-loader-0.7.1 compiles all of opal, a bunch of gems and over 19000SLC on a
Intel® Core™ i7-7700HQ CPU @ 2.80GHz × 8, with 8 workers in around 1850ms
- opal modules are packaged as es6 modules
- support for rails with webpacker
- other webpack features become available, like:
  - source maps
  - multiple targets: web (for browsers), node (for server side rendering) and webworker (for Web Workers)
  - hot module reloading for opal ruby code and stylesheets and html views
  - tree shaking
  - code splitting
  - lazy loading
  - everything else webpack can do, like loading stylesheets, etc.

### Requirements
- opal-webpack-loader consists of 2 parts, the npm package and the gem, both are required and must be the same version.
- webpack 4.30
- webpack-dev-server 3.3.0
- one of the ES6 modules branches of opal
  - [PR#1970](https://github.com/opal/opal/pull/1969), (recommended)  implementing ES6 modules and changes for 'strict' mode,
    based on Opal master 1.0.0 using javascript string primitives
    
    `gem 'opal', github: 'janbiedermann/opal', branch: 'es6_modules'`
    
  - [PR#1973](https://github.com/opal/opal/pull/1973), (experimental) implementing ES6 modules and changes for 'strict' mode,
    based on Opal master 1.0.0 using javascript string objects "mutable strings" by default for all strings
    
    `gem 'opal', github: 'janbiedermann/opal', branch: 'es6_modules_string'`
    
  - [PR#1976](https://github.com/opal/opal/pull/1976), (experimental) implementing ES6 modules and changes for 'strict' mode,
    based on Opal master 1.1.0 using javascript string primitives and providing nice features like `require_lazy 'my_module'`
    
    `gem 'opal', github: 'janbiedermann/opal', branch: 'es6_modules_1_1'`
    
- if you have the webpacker gem installed somewhere, it should be a version supporting webpack 4
- ruby, version 2.5 or higher recommended
- bundler, latest version recommended

### Installation

#### Using the installer
First install the gem:
```
gem install 'opal-webpack-loader'
```

Continue here:
- [Install for Rails like projects](https://github.com/isomorfeus/opal-webpack-loader/blob/master/docs/installation_rails.md)
- [Install for Cuba, Roda, Sinatra and other projects with a flat structure](https://github.com/isomorfeus/opal-webpack-loader/blob/master/docs/installation_flat.md)           
- [Manual Installation](https://github.com/isomorfeus/opal-webpack-loader/blob/master/docs/installation_manual.md)

### Example applications
[are here](https://github.com/isomorfeus/opal-webpack-loader/tree/master/example_apps/)

### General Usage without Webpacker

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

Since version 0.8.0 the number of CPUs is automatically determined and a appropriate number of of compile server workers is started automatically.

### Source Maps

[Source Maps](https://github.com/isomorfeus/opal-webpack-loader/blob/master/docs/source_maps.md)

### Hot Module Reloading
[Hot Module Reloading](https://github.com/isomorfeus/opal-webpack-loader/blob/master/docs/hot_module_reloading.md)

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
### Advanced Options
[Advanced Options](https://github.com/isomorfeus/opal-webpack-loader/blob/master/docs/advanced_options.md)
### Tests
- clone the repo
- `bundle install`
- `bundle exec rspec`