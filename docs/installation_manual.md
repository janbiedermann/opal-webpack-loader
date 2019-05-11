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
