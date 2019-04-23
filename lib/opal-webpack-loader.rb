# check version of opal-webpack-loader-npm
require 'opal-webpack-loader/version'
require 'opal-webpack-loader/manifest'

module OpalWebpackLoader
  class << self
    attr_accessor :client_asset_path
    attr_accessor :manifest_path
    attr_accessor :use_manifest

    def application_js_path
      if OpalWebpackLoader.use_manifest
        asset_path = OpalWebpackLoader::Manifest.lookup_path_for("application.js")
        "OpalWebpackLoader.client_asset_path}#{asset_path}"
      else
        "#{OpalWebpackLoader.client_asset_path}application.js"
      end
    end

    def application_ssr_js_path
      if OpalWebpackLoader.use_manifest
        asset_path = OpalWebpackLoader::Manifest.lookup_path_for("application_ssr.js")
        "OpalWebpackLoader.client_asset_path}#{asset_path}"
      else
        "#{OpalWebpackLoader.client_asset_path}application_ssr.js"
      end
    end
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

# TODO require yarn instead of npm
# TODO don't depend on which for non unixes
npm = `which npm`.chop

if npm != ''
  bin_dir = `npm bin`.chop
  begin
    owl_npm_version = `#{File.join(bin_dir, 'opal-webpack-loader-npm-version')}`.chop
  rescue
    owl_npm_version = nil
  end

  if owl_npm_version != OpalWebpackLoader::VERSION
    STDERR.puts "opal-webpack-loader: Incorrect version of npm package found or npm package not installed.\n" +
      "Please install the npm package for opal-webpack-loader:\n" +
      "\twith npm:\tnpm install opal-webpack-loader@#{OpalWebpackLoader::VERSION} --save-dev\n" +
      "\tor with yarn:\tyarn add opal-webpack-loader@#{OpalWebpackLoader::VERSION} --dev\n"
  end
else
  STDERR.puts "opal-webpack-loader: Unable to check npm package version. Please check your npm installation."
end