require 'spec_helper'

RSpec.describe 'owl installer' do
  context 'structure: :app' do
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

    it 'can install in a rails app without sprockets and webpacker gem' do
      `env -i PATH="#{ENV['PATH']}" rails new railing --skip-git --skip-bundle --skip-sprockets --skip-javascript --skip-spring --skip-bootsnap`
      expect(Dir.exist?('railing')).to be true
      Dir.chdir('railing')
      expect(Dir.exist?(File.join( 'config', 'webpack'))).to be false
      OpalWebpackLoader::Installer::CLI.start(%w[rails])
      expect(File.exist?(File.join('app', 'assets', 'javascripts', 'application.js'))).to be true
      expect(File.exist?(File.join('app', 'assets', 'javascripts', 'application_common.js'))).to be true
      expect(File.exist?(File.join('app', 'assets', 'javascripts', 'application_debug.js'))).to be true
      expect(File.exist?(File.join('app', 'assets', 'javascripts', 'application_ssr.js'))).to be true
      expect(File.exist?(File.join('app', 'assets', 'javascripts', 'application_web_worker.js'))).to be true
      expect(File.exist?(File.join('app', 'opal', 'opal_loader.rb'))).to be true
      expect(File.exist?(File.join('app', 'opal', 'opal_web_worker_loader.rb'))).to be true
      expect(File.exist?(File.join('config', 'initializers', 'opal_webpack_loader.rb'))).to be true
      expect(File.exist?(File.join('config', 'webpack', 'debug.js'))).to be true
      expect(File.exist?(File.join('config', 'webpack', 'development.js'))).to be true
      expect(File.exist?(File.join('config', 'webpack', 'production.js'))).to be true
      expect(Dir.exist?(File.join('public', 'assets'))).to be true
      expect(File.exist?('package.json')).to be true
      expect(File.exist?('Procfile')).to be true
    end

    it 'can install in a rails app without sprockets and webpacker gem specifying another opal files dir' do
      `env -i PATH="#{ENV['PATH']}" rails new railing --skip-git --skip-bundle --skip-sprockets --skip-javascript --skip-spring --skip-bootsnap`
      expect(Dir.exist?('railing')).to be true
      Dir.chdir('railing')
      expect(Dir.exist?(File.join('config', 'webpack'))).to be false
      OpalWebpackLoader::Installer::CLI.start(%w[rails -o hyperhyper])
      expect(File.exist?(File.join('app', 'assets', 'javascripts', 'application.js'))).to be true
      expect(File.exist?(File.join('app', 'assets', 'javascripts', 'application_common.js'))).to be true
      expect(File.exist?(File.join('app', 'assets', 'javascripts', 'application_debug.js'))).to be true
      expect(File.exist?(File.join('app', 'assets', 'javascripts', 'application_ssr.js'))).to be true
      expect(File.exist?(File.join('app', 'assets', 'javascripts', 'application_web_worker.js'))).to be true
      expect(File.exist?(File.join('app', 'hyperhyper', 'hyperhyper_loader.rb'))).to be true
      expect(File.exist?(File.join('app', 'hyperhyper', 'hyperhyper_web_worker_loader.rb'))).to be true
      expect(File.exist?(File.join('config', 'initializers', 'opal_webpack_loader.rb'))).to be true
      expect(File.exist?(File.join('config', 'webpack', 'debug.js'))).to be true
      expect(File.exist?(File.join('config', 'webpack', 'development.js'))).to be true
      expect(File.exist?(File.join('config', 'webpack', 'production.js'))).to be true
      expect(Dir.exist?(File.join('public', 'assets'))).to be true
      expect(File.exist?('package.json')).to be true
      expect(File.exist?('Procfile')).to be true
    end

    it 'can install in a rails app without sprockets and with webpacker gem specifying another opal files dir' do
      `env -i PATH="#{ENV['PATH']}" rails new railing --skip-git --skip-bundle --skip-sprockets --skip-spring --skip-bootsnap --webpack`
      expect(Dir.exist?('railing')).to be true
      Dir.chdir('railing')
      expect(File.exist?(File.join('config', 'webpack', 'environment.js'))).to be true
      OpalWebpackLoader::Installer::CLI.start(%w[webpacker -o hyperhyper])
      expect(File.exist?(File.join('app', 'javascript', 'packs', 'application.js'))).to be true
      expect(File.exist?(File.join('app', 'hyperhyper', 'hyperhyper_loader.rb'))).to be true
      expect(File.exist?(File.join('app', 'hyperhyper', 'hyperhyper_web_worker_loader.rb'))).to be true
      expect(File.exist?(File.join('config', 'initializers', 'opal_webpack_loader.rb'))).to be true
      environment_js = File.read(File.join('config', 'webpack', 'environment.js'))
      expect(environment_js).to include('// begin # added by the owl-install')
      expect(File.exist?(File.join('config', 'webpack', 'development.js'))).to be true
      expect(File.exist?(File.join('config', 'webpack', 'production.js'))).to be true
      expect(Dir.exist?(File.join('public', 'assets'))).to be true
      expect(File.exist?('package.json')).to be true
    end
  end

  context 'structure: :flat' do
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

    it 'can install in a roda app' do
      FileUtils.cp_r(File.join('..', 'fixtures', 'flattering'), File.join('.'))
      expect(Dir.exist?('flattering')).to be true
      Dir.chdir('flattering')
      arg_val = %w[flat]
      OpalWebpackLoader::Installer::CLI.start(arg_val)
      expect(File.exist?(File.join('styles', 'application.css'))).to be true
      expect(File.exist?(File.join('javascripts', 'application.js'))).to be true
      expect(File.exist?(File.join('javascripts', 'application_common.js'))).to be true
      expect(File.exist?(File.join('javascripts', 'application_debug.js'))).to be true
      expect(File.exist?(File.join('javascripts', 'application_ssr.js'))).to be true
      expect(File.exist?(File.join('opal', 'opal_loader.rb'))).to be true
      expect(File.exist?(File.join('owl_init.rb'))).to be true
      expect(File.exist?(File.join('app_loader.rb'))).to be true
      expect(File.exist?(File.join('webpack', 'debug.js'))).to be true
      expect(File.exist?(File.join('webpack', 'development.js'))).to be true
      expect(File.exist?(File.join('webpack', 'production.js'))).to be true
      expect(Dir.exist?(File.join('public', 'assets'))).to be true
      expect(File.exist?('package.json')).to be true
      expect(File.exist?('Procfile')).to be true
    end
  end

  context 'for isomorfeus' do
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

    it 'can install' do
      FileUtils.cp_r(File.join('..', 'fixtures', 'flattering'), File.join('.'))
      expect(Dir.exist?('flattering')).to be true
      Dir.chdir('flattering')
      arg_val = %w[iso]
      OpalWebpackLoader::Installer::CLI.start(arg_val)
      expect(File.exist?(File.join('owl_init.rb'))).to be true
      expect(File.exist?(File.join('webpack', 'debug.js'))).to be true
      expect(File.exist?(File.join('webpack', 'development.js'))).to be true
      expect(File.exist?(File.join('webpack', 'production.js'))).to be true
      expect(Dir.exist?(File.join('public', 'assets'))).to be true
    end
  end
end