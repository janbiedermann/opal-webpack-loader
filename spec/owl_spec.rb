require 'spec_helper'

RSpec.describe 'owl' do
  context 'in a rails app' do
    before :all do
      `npm pack`
    end

    before do
      Dir.chdir('spec')
      Dir.chdir('test_apps')
      FileUtils.rm_rf('railing') if Dir.exist?('railing')
      `yarn cache clean`
    end

    after do
      Dir.chdir('..') if Dir.pwd.end_with?('railing')
      FileUtils.rm_rf('railing') if Dir.exist?('railing')
      Dir.chdir('..')
      Dir.chdir('..')
    end

    it 'can run the production build script' do
      `bundle exec rails new railing --skip-git --skip-bundle --skip-sprockets --skip-javascript --skip-spring --skip-bootsnap`
      expect(Dir.exist?('railing')).to be true
      Dir.chdir('railing')
      arg_val = %w[rails]
      expect(Dir.exist?(File.join('railing', 'config', 'webpack'))).to be false
      OpalWebpackLoader::Installer::CLI.start(arg_val)
      gemfile = File.read('Gemfile')
      gemfile << <<~GEMS

      gem 'opal', github: 'janbiedermann/opal', branch: 'es6_import_export'
      gem 'opal-webpack-loader', path: '#{File.realpath(File.join('..','..', '..', '..', 'opal-webpack-loader'))}'

      GEMS
      File.write('Gemfile', gemfile)
      # add local owl npm package
      package_json = Oj.load(File.read('package.json'), mode: :strict)
      package_json["devDependencies"].delete("opal-webpack-loader")
      File.write('package.json', Oj.dump(package_json, mode: :strict))
      `yarn add file:../../../opal-webpack-loader-#{OpalWebpackLoader::VERSION}.tgz`
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
    before :all do
      `npm pack`
    end

    before do
      Dir.chdir('spec')
      Dir.chdir('test_apps')
      FileUtils.rm_rf('flattering') if Dir.exist?('flattering')
      `yarn cache clean`
    end

    after do
      Dir.chdir('..') if Dir.pwd.end_with?('flattering')
      # FileUtils.rm_rf('flattering') if Dir.exist?('flattering')
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
      # add local owl npm package
      package_json = Oj.load(File.read('package.json'), mode: :strict)
      package_json["devDependencies"].delete("opal-webpack-loader")
      File.write('package.json', Oj.dump(package_json, mode: :strict))
      `yarn add file:../../../opal-webpack-loader-#{OpalWebpackLoader::VERSION}.tgz`
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

    it 'can run the production build script in a roda app and execute ruby code in the browser' do
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
      # add local owl npm package
      package_json = Oj.load(File.read('package.json'), mode: :strict)
      package_json["devDependencies"].delete("opal-webpack-loader")
      File.write('package.json', Oj.dump(package_json, mode: :strict))
      `yarn add file:../../../opal-webpack-loader-#{OpalWebpackLoader::VERSION}.tgz`
      `yarn add puppeteer@1.14.0 --dev`
      `yarn install`
      # bundler set some environment things, but we need a clean environment, so things don't get mixed up, use env
      `env -i PATH="#{ENV['PATH']}" bundle install`
      expect(File.exist?('Gemfile.lock')).to be true
      `env -i PATH="#{ENV['PATH']}" yarn run production_build`
      expect(File.exist?(File.join('public', 'assets', 'manifest.json'))).to be true
      manifest = Oj.load(File.read(File.join('public', 'assets', 'manifest.json')), mode: :strict)
      application_js = manifest['application.js']
      expect(File.exist?(File.join('public', application_js))).to be true
      `env -i PATH="#{ENV['PATH']}" bundle exec rspec`
    end
  end
end
