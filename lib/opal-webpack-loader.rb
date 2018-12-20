# check version of opal-webpack-loader-npm
require 'opal-webpack-loader/version'
require 'opal-webpack-loader/manifest'
if defined? Rails
  require 'opal-webpack-loader/rails_view_helper'
else
  require 'opal-webpack-loader/view_helper'
end
