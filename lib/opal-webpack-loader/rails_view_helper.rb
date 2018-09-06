module OpalWebpackLoader
  module RailsViewHelper
    def owl_include_tag(path)
      case Rails.env
      when 'production'
        public, packs, asset = path.split('/')
        asset_path = OpalWebpackLoader::Manifest.lookup_path_for(asset)
        javascript_include_tag(asset_path)
      when 'development'
        javascript_include_tag('http://localhost:3035' + path[0..-4] + '_development' + path[-3..-1])
      when 'test'
        real_path = path[0..-4] + '_test' + path[-3..-1]
        public, packs, asset = real_path.split('/')
        asset_path = OpalWebpackLoader::Manifest.lookup_path_for(asset)
        javascript_include_tag(asset_path)
      end
    end
  end
end