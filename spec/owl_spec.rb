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
      # FileUtils.rm_rf('railing') if Dir.exist?('railing')
      Dir.chdir('..')
      Dir.chdir('..')
    end

    it 'without webpacker it can run the production build script' do
      `env -i PATH="#{ENV['PATH']}" rails new railing --skip-git --skip-bundle --skip-sprockets --skip-javascript --skip-spring --skip-bootsnap`
      expect(Dir.exist?('railing')).to be true
      Dir.chdir('railing')
      expect(Dir.exist?(File.join('config', 'webpack'))).to be false
      OpalWebpackLoader::Installer::CLI.start(%w[rails])
      gemfile = File.read('Gemfile')
      gemfile << <<~GEMS

      gem 'opal', github: 'janbiedermann/opal', branch: 'es6_modules'
      gem 'opal-webpack-loader', path: '#{File.realpath(File.join('..','..', '..', '..', 'opal-webpack-loader'))}'

      GEMS
      File.write('Gemfile', gemfile)
      # add local owl npm package
      package_json = Oj.load(File.read('package.json'), mode: :strict)
      package_json["dependencies"].delete("opal-webpack-loader")
      File.write('package.json', Oj.dump(package_json, mode: :strict))
      `env -i PATH="#{ENV['PATH']}" yarn add file:../../../opal-webpack-loader-#{OpalWebpackLoader::VERSION}.tgz`
      `env -i PATH="#{ENV['PATH']}" yarn install`
      # bundler set some environment things, but we need a clean environment, so things don't get mixed up, use env
      `env -i PATH="#{ENV['PATH']}" bundle install`
      expect(File.exist?('Gemfile.lock')).to be true
      puts `env -i PATH="#{ENV['PATH']}" yarn run production_build`
      expect(File.exist?(File.join('public', 'assets', 'manifest.json'))).to be true
      manifest = Oj.load(File.read(File.join('public', 'assets', 'manifest.json')), mode: :strict)
      application_js = manifest['application.js']
      expect(File.exist?(File.join('public', application_js))).to be true
    end

    it 'with webpacker it can run the production build script' do
      `env -i PATH="#{ENV['PATH']}" rails new railing --skip-git --skip-bundle --skip-sprockets --skip-spring --skip-bootsnap --webpack`
      expect(Dir.exist?('railing')).to be true
      Dir.chdir('railing')
      expect(File.exist?(File.join( 'config', 'webpack', 'environment.js'))).to be true
      expect(File.exist?(File.join( 'app', 'javascript', 'packs', 'application.js'))).to be true
      OpalWebpackLoader::Installer::CLI.start(%w[webpacker])
      gemfile = File.read('Gemfile')
      gemfile << <<~GEMS

      gem 'opal', github: 'janbiedermann/opal', branch: 'es6_modules'
      gem 'opal-webpack-loader', path: '#{File.realpath(File.join('..','..', '..', '..', 'opal-webpack-loader'))}'

      GEMS
      File.write('Gemfile', gemfile)
      # add local owl npm package
      `env -i PATH="#{ENV['PATH']}" yarn add file:../../../opal-webpack-loader-#{OpalWebpackLoader::VERSION}.tgz`
      # bundler set some environment things, but we need a clean environment, so things don't get mixed up, use env
      `env -i PATH="#{ENV['PATH']}" bundle install`
      expect(File.exist?('Gemfile.lock')).to be true
      puts `env -i PATH="#{ENV['PATH']}" RAILS_ENV="production" bundle exec rails assets:precompile`
      expect(File.exist?(File.join('public', 'packs', 'manifest.json'))).to be true
      manifest = Oj.load(File.read(File.join('public', 'packs', 'manifest.json')), mode: :strict)
      application_js = manifest['application.js']
      expect(File.exist?(File.join('public', application_js))).to be true
      expect(File.read(File.join('public', application_js), mode: 'r')).to include('global.Opal')
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
      FileUtils.rm_rf('flattering') if Dir.exist?('flattering')
      Dir.chdir('..')
      Dir.chdir('..')
    end

    it 'can run the production build script in a roda app' do
      FileUtils.cp_r(File.join('..', 'fixtures', 'flattering'), File.join('.'))
      expect(Dir.exist?('flattering')).to be true
      Dir.chdir('flattering')
      OpalWebpackLoader::Installer::CLI.start(%w[flat])

      gemfile = File.read('Gemfile')
      gemfile << <<~GEMS

      gem 'opal', github: 'janbiedermann/opal', branch: 'es6_modules'
      gem 'opal-webpack-loader', path: '#{File.realpath(File.join('..','..', '..', '..', 'opal-webpack-loader'))}'

      GEMS
      File.write('Gemfile', gemfile)
      # add local owl npm package
      package_json = Oj.load(File.read('package.json'), mode: :strict)
      package_json["dependencies"].delete("opal-webpack-loader")
      File.write('package.json', Oj.dump(package_json, mode: :strict))
      `env -i PATH="#{ENV['PATH']}" yarn add file:../../../opal-webpack-loader-#{OpalWebpackLoader::VERSION}.tgz`
      `env -i PATH="#{ENV['PATH']}" yarn install`
      # bundler set some environment things, but we need a clean environment, so things don't get mixed up, use env
      `env -i PATH="#{ENV['PATH']}" bundle install`
      expect(File.exist?('Gemfile.lock')).to be true
      puts `env -i PATH="#{ENV['PATH']}" yarn run production_build`
      expect(File.exist?(File.join('public', 'assets', 'manifest.json'))).to be true
      manifest = Oj.load(File.read(File.join('public', 'assets', 'manifest.json')), mode: :strict)
      application_js = manifest['application.js']
      expect(File.exist?(File.join('public', application_js))).to be true
    end

    it 'can run the production build script in a roda app and execute ruby code in the browser with the es6_modules branch' do
      FileUtils.cp_r(File.join('..', 'fixtures', 'flattering'), File.join('.'))
      expect(Dir.exist?('flattering')).to be true
      Dir.chdir('flattering')
      OpalWebpackLoader::Installer::CLI.start(%w[flat])

      gemfile = File.read('Gemfile')
      gemfile << <<~GEMS

      gem 'opal', github: 'janbiedermann/opal', branch: 'es6_modules'
      gem 'opal-webpack-loader', path: '#{File.realpath(File.join('..','..', '..', '..', 'opal-webpack-loader'))}'

      GEMS
      File.write('Gemfile', gemfile)
      # add local owl npm package
      package_json = Oj.load(File.read('package.json'), mode: :strict)
      package_json["dependencies"].delete("opal-webpack-loader")
      File.write('package.json', Oj.dump(package_json, mode: :strict))
      `env -i PATH="#{ENV['PATH']}" yarn add file:../../../opal-webpack-loader-#{OpalWebpackLoader::VERSION}.tgz`
      `env -i PATH="#{ENV['PATH']}" yarn add puppeteer@1.14.0 --dev`
      `env -i PATH="#{ENV['PATH']}" yarn install`
      # bundler set some environment things, but we need a clean environment, so things don't get mixed up, use env
      `env -i PATH="#{ENV['PATH']}" bundle install`
      expect(File.exist?('Gemfile.lock')).to be true
      puts `env -i PATH="#{ENV['PATH']}" yarn run production_build`
      expect(File.exist?(File.join('public', 'assets', 'manifest.json'))).to be true
      manifest = Oj.load(File.read(File.join('public', 'assets', 'manifest.json')), mode: :strict)
      application_js = manifest['application.js']
      expect(File.exist?(File.join('public', application_js))).to be true
      test_result = `env -i PATH="#{ENV['PATH']}" bundle exec rspec`
      puts test_result
      expect(test_result).to include('1 example, 0 failures')
    end

    it 'can run the production build script in a roda app and execute ruby code in the browser with the es6_modules_string branch' do
      FileUtils.cp_r(File.join('..', 'fixtures', 'flattering'), File.join('.'))
      expect(Dir.exist?('flattering')).to be true
      Dir.chdir('flattering')
      OpalWebpackLoader::Installer::CLI.start(%w[flat])

      gemfile = File.read('Gemfile')
      gemfile << <<~GEMS

      gem 'opal', github: 'janbiedermann/opal', branch: 'es6_modules_string'
      gem 'opal-webpack-loader', path: '#{File.realpath(File.join('..','..', '..', '..', 'opal-webpack-loader'))}'

      GEMS
      File.write('Gemfile', gemfile)
      # add local owl npm package
      package_json = Oj.load(File.read('package.json'), mode: :strict)
      package_json["devDependencies"].delete("opal-webpack-loader")
      File.write('package.json', Oj.dump(package_json, mode: :strict))
      `env -i PATH="#{ENV['PATH']}" yarn add file:../../../opal-webpack-loader-#{OpalWebpackLoader::VERSION}.tgz`
      `env -i PATH="#{ENV['PATH']}" yarn add puppeteer@1.14.0 --dev`
      `env -i PATH="#{ENV['PATH']}" yarn install`
      # bundler set some environment things, but we need a clean environment, so things don't get mixed up, use env
      `env -i PATH="#{ENV['PATH']}" bundle install`
      expect(File.exist?('Gemfile.lock')).to be true
      puts `env -i PATH="#{ENV['PATH']}" yarn run production_build`
      expect(File.exist?(File.join('public', 'assets', 'manifest.json'))).to be true
      manifest = Oj.load(File.read(File.join('public', 'assets', 'manifest.json')), mode: :strict)
      application_js = manifest['application.js']
      expect(File.exist?(File.join('public', application_js))).to be true
      test_result = `env -i PATH="#{ENV['PATH']}" bundle exec rspec`
      expect(test_result).to include('1 example, 0 failures')
    end
  end
end
