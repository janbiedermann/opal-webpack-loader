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
