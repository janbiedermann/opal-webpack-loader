require 'spec_helper'

RSpec.describe 'owl' do
  context 'in a rails app' do
    before do
      Dir.chdir('spec')
      Dir.chdir('test_apps')
      FileUtils.rm_rf('railing') if Dir.exist?('railing')
    end

    after do
      Dir.chdir('..') if Dir.pwd.end_with?('railing')
      FileUtils.rm_rf('railing') if Dir.exist?('railing')
      Dir.chdir('..')
      Dir.chdir('..')
    end

    it 'can run the production build script' do
      `bundle exec rails new railing --skip-git --skip-bundle --skip-sprockets --skip-spring --skip-bootsnap`
      expect(Dir.exist?('railing')).to be true
      Dir.chdir('railing')
      arg_val = %w[rails]
      expect(Dir.exist?(File.join('railing', 'config', 'webpack'))).to be false
      OpalWebpackLoader::Installer::CLI.start(arg_val)
      FileUtils.mv(File.join('app', 'assets', 'javascripts', 'application.js_owl_new'), File.join('app', 'assets', 'javascripts', 'application.js´'))
      gemfile = File.read('Gemfile')
      gemfile << <<~GEMS

      gem 'opal', github: 'janbiedermann/opal', branch: 'es6_import_export'
      gem 'opal-webpack-loader', path: '#{File.realpath(File.join('..','..', '..', '..', 'opal-webpack-loader'))}'

      GEMS
      File.write('Gemfile', gemfile)
      `yarn install`
      # bundler set some environment things, but we need a clean environment, so things don't get mixed up, use env
      `env -i PATH="#{ENV['PATH']}" bundle install`
      expect(File.exist?('Gemfile.lock')).to be true
      `env -i PATH="#{ENV['PATH']}" yarn run production_build`
      expect(File.exist?(File.join('public', 'assets', 'manifest.json'))).to be true
      manifest = Oj.load(File.read(File.join('public', 'assets', 'manifest.json')), mode: :strict)
      application_js = manifest['application.js']
      expect(File.exist?(File.join('public', application_js))).to be true
    end
  end

  context 'in a roda app' do
    before do
      Dir.chdir('spec')
      Dir.chdir('test_apps')
      FileUtils.rm_rf('flattering') if Dir.exist?('flattering')
    end

    after do
      Dir.chdir('..') if Dir.pwd.end_with?('flattering')
      FileUtils.rm_rf('flattering') if Dir.exist?('flattering')
      Dir.chdir('..')
      Dir.chdir('..')
    end

    it 'can run the production build script in a roda app' do
      FileUtils.cp_r(File.join('..', 'fixtures', 'flattering'), File.join('.'))
      expect(Dir.exist?('flattering')).to be true
      Dir.chdir('flattering')
      arg_val = %w[flat]
      OpalWebpackLoader::Installer::CLI.start(arg_val)

      gemfile = File.read('Gemfile')
      gemfile << <<~GEMS

      gem 'opal', github: 'janbiedermann/opal', branch: 'es6_import_export'
      gem 'opal-webpack-loader', path: '#{File.realpath(File.join('..','..', '..', '..', 'opal-webpack-loader'))}'

      GEMS
      File.write('Gemfile', gemfile)
      `yarn install`
      # bundler set some environment things, but we need a clean environment, so things don't get mixed up, use env
      `env -i PATH="#{ENV['PATH']}" bundle install`
      expect(File.exist?('Gemfile.lock')).to be true
      `env -i PATH="#{ENV['PATH']}" yarn run production_build`
      expect(File.exist?(File.join('public', 'assets', 'manifest.json'))).to be true
      manifest = Oj.load(File.read(File.join('public', 'assets', 'manifest.json')), mode: :strict)
      application_js = manifest['application.js']
      expect(File.exist?(File.join('public', application_js))).to be true
    end
  end
end
