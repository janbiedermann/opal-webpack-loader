ENV['NODE_PATH'] = File.join(File.expand_path('..', __dir__), 'node_modules')
ENV['OWL_ENV'] = 'production'
require 'bundler/setup'
require 'rspec'
require 'rspec/expectations'
require 'isomorfeus-puppetmaster'
# frozen_string_literal: true
require_relative '../app'

Isomorfeus::Puppetmaster.download_path = File.join(Dir.pwd, 'download_path_tmp')
Isomorfeus::Puppetmaster.driver = :chromium
Isomorfeus::Puppetmaster.app = App
Isomorfeus::Puppetmaster.boot_app

RSpec.configure do |config|
  config.include Isomorfeus::Puppetmaster::DSL
end
