require 'bundler/setup'
if ENV['FLATTERING_ENV'] && ENV['FLATTERING_ENV'] == 'test'
  Bundler.require(:default, :test)
elsif ENV['FLATTERING_ENV'] && ENV['FLATTERING_ENV'] == 'production'
  Bundler.require(:default, :production)
else
  Bundler.require(:default, :development)
end