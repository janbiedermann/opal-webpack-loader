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
