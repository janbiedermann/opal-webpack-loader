require 'oj'

task :build_packages do
  package_json = Oj.load(File.read('package.json'))
  version = package_json['version']
  puts "Building packages with version #{version}"
  version_code = <<-CODE
module OpalWebpackLoader
  VERSION="#{version}"
end
  CODE
  File.write('lib/opal-webpack-loader/version.rb', version_code)
  `npm pack`
  `gem build opal-webpack-loader`
end

task :push_packages, [:npm_otp] do |_, args|
  package_json = Oj.load(File.read('package.json'))
  version = package_json['version']
  puts `npm publish opal-webpack-loader-#{version}.tgz --otp=#{args[:npm_otp]}`
  puts `gem push opal-webpack-loader-#{version}.gem`
end
