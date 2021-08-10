require_relative 'lib/opal-webpack-loader/version'

Gem::Specification.new do |s|
  s.name         = 'opal-webpack-loader'
  s.version      = OpalWebpackLoader::VERSION
  s.author       = 'Jan Biedermann'
  s.email        = 'jan@kursator.de'
  s.licenses     = %w[MIT]
  s.homepage     = 'http://isomorfeus.com'
  s.summary      = 'Bundle assets with webpack, resolve and compile opal ruby files and import them in the bundle.'
  s.description  = <<~TEXT
    Bundle assets with webpack, resolve and compile opal ruby files
    and import them in the bundle, without sprockets or the webpacker gem
    (but can be used with both of them too). 
    Comes with a installer for rails and other frameworks.
  TEXT
  s.metadata      = { "github_repo" => "ssh://github.com/isomorfeus/gems" }
  s.executables << 'opal-webpack-compile-server'
  s.executables << 'owl-install'
  s.executables << 'owl-gen-loadpath-cache'
  s.executables << 'owl-compiler'
  s.executables << 'opal-webpack-windows-compile-server'
  s.files          = `git ls-files -- lib LICENSE README.md`.split("\n")
  s.require_paths  = ['lib']

  s.add_dependency 'opal', '~> 1.2.0'
  s.add_dependency 'dalli', '~> 2.7.0'
  s.add_dependency 'ffi', '~> 1.15.1'
  s.add_dependency 'oj', '~> 3.12.0'
  s.add_dependency 'redis', '~> 4.4.0'
  s.add_dependency 'thor', '>= 0.19.4'
  s.add_development_dependency 'bundler'
  s.add_development_dependency 'listen'
  s.add_development_dependency 'rake'
  s.add_development_dependency 'rails', '~> 6.1.0'
  s.add_development_dependency 'roda', '~> 3.46.0'
  s.add_development_dependency 'rspec', '~> 3.8.0'
  s.add_development_dependency 'webpacker', '>= 5.3.0'
end
