### Install for Rails like projects

#### With the Webpacker Gem
Within the projects root directory execute:
```bash
owl-install webpacker
```

It configures all the required things and merges a basic configuration to `config/webpack/environment.js`. Adjust that file to your preference.
Opal ruby files should then go in the newly created `app/opal` directory. With the option -o the directory can be named differently, for example:
```bash
owl-install rails -o hyperhyper
```
A directory `app/hyperhyper` will be created, opal files should then go there and will be properly resolved by webpack.

The entry file for imports is `app/javascript/packs/application.js`.

The `OpalWebpackLoader::RailsViewHelper` is not needed.

Continue below, section "For Both".

#### Without the Webpacker Gem
If you start a new rails project, the following options are recommended for `rails new`: `--skip-sprockets --skip-javascript`

Then within the projects root directory execute:
```bash
owl-install rails
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

To load the compiled asset files the `owl_include_tag` view helper must be used. Please see the sections "View Helper" and 
"Project configuration options for the view helper" in the main README.

Continue below, section "For Both".

#### For Both

Please see the messages of owl-install. You may need to manually add the following gems to the projects Gemfile:
```ruby
gem 'opal', github: 'janbiedermann/opal', branch: 'es6_modules_1_1' # use the recommend branch of the main README
gem 'opal-webpack-loader', '~> 0.9.2' # use the most recent released version here
```

Then:
```bash
yarn install
bundle install
```

