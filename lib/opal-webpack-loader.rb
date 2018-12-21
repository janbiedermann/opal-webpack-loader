# check version of opal-webpack-loader-npm
require 'opal-webpack-loader/version'
require 'opal-webpack-loader/manifest'

module OpalWebpackLoader
  def self.manifest_path
    @manifest_path
  end

  def self.manifest_path=(path)
    @manifest_path = path
  end

  def self.client_asset_path
    @client_asset_path
  end

  def self.client_asset_path=(path)
    @client_asset_path = path
  end

  def self.use_manifest
    @use_manifest
  end

  def self.use_manifest=(bool)
    @use_manifest = bool
  end
end

if defined? Rails
  require 'opal-webpack-loader/rails_view_helper'
else
  require 'opal-webpack-loader/view_helper'
end

OpalWebpackLoader.manifest_path = File.join(Dir.getwd, 'public', 'assets', 'manifest.json')
OpalWebpackLoader.client_asset_path = 'http://localhost:3035/assets/'
OpalWebpackLoader.use_manifest = false

npm = `which npm`.chop

if npm != ''
  bin_dir = `npm bin`.chop
  begin
    owl_npm_version = `#{bin_dir}/opal-webpack-loader-npm-version`.chop
  rescue
    owl_npm_version = nil
  end

  if owl_npm_version != OpalWebpackLoader::VERSION
    raise "opal-webpack-loader: Incorrect version of npm package found or npm package not installed.\n" +
      "Please install the npm package for opal-webpack-loader:\n" +
      "\twith npm:\tnpm install opal-webpack-loader@#{OpalWebpackLoader::VERSION} --save-dev\n" +
      "\tor with yarn:\tyarn add opal-webpack-loader@#{OpalWebpackLoader::VERSION} --dev\n"
  end
else
  STDERR.puts "opal-webpack-loader: Unable to check npm package version. Please check your npm installation."
end