require_relative 'lib/opal-webpack-loader/version'

Gem::Specification.new do |s|
  s.name         = 'opal-webpack-loader'
  s.version      = OpalWebpackLoader::VERSION
  s.author       = 'Jan Biedermann'
  s.email        = 'jan@kursator.de'
  s.licenses     = %w[MIT]
  s.homepage     = 'http://hyperstack.org'
  s.summary      = 'Compile server, loader and resolver for building opal ruby packs with webpack.'
  s.description  = 'Compile server, loader and resolver for building opal ruby packs with webpack.'
  s.executables << 'opal-webpack-compile-server'
  s.files          = `git ls-files -- lib`.split("\n")
  s.test_files     = `git ls-files -- {test,spec,features}/*`.split("\n")
  s.require_paths  = ['lib']

  s.add_dependency 'opal', '~> 0.11.0'
  s.add_dependency 'eventmachine', '~> 1.2.7'
  s.add_dependency 'oj', '~> 3.6.0'
  s.add_development_dependency 'rake'
end