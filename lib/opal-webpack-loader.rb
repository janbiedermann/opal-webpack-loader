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

owl_npm_version = nil

yarn = if Gem.win_platform?
         `where yarn`.chop.lines.last
       else
         `which yarn`.chop
       end
if !yarn.nil? && !yarn.empty?
  begin
    owl_npm_version = `yarn run -s opal-webpack-loader-npm-version`.chop
  rescue
    owl_npm_version = nil
  end
end

unless owl_npm_version
  npm = if Gem.win_platform?
          `where npm`.chop.lines.last
        else
          `which npm`.chop
        end
  if !npm.nil? && !npm.empty?
    begin
      owl_npm_version = `npm exec opal-webpack-loader-npm-version`.chop
    rescue
      owl_npm_version = nil
    end
  end
end

if owl_npm_version != OpalWebpackLoader::VERSION
  STDERR.puts "opal-webpack-loader: Incorrect version of npm package found or npm package not installed.\n" +
    "Please install the npm package for opal-webpack-loader:\n" +
    "\twith npm:\tnpm install opal-webpack-loader@#{OpalWebpackLoader::VERSION}\n" +
    "\tor with yarn:\tyarn add opal-webpack-loader@#{OpalWebpackLoader::VERSION}\n"
end

