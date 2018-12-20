# check version of opal-webpack-loader-npm
require 'opal-webpack-loader/version'
require 'opal-webpack-loader/manifest'
if defined? Rails
  require 'opal-webpack-loader/rails_view_helper'
else
  require 'opal-webpack-loader/view_helper'
end

owl_version = ''
npm = `which npm`.chop

if npm != ''
  owl_version = `#{npm} view opal-webpack-loader version`
else
  yarn = `which yarn`.chop
  if yarn != ''
    owl_version = `#{yarn} -s info opal-webpack-loader version`
  else
    raise 'opal-webpack-loader: Could not find npm or yarn! Please install npm or yarn'
  end
end
