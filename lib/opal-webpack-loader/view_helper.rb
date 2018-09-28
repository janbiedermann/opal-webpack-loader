module OpalWebpackLoader
  module ViewHelper
    def owl_include_tag(path)
      case Rails.env
      when 'production'
        public, packs, asset = path.split('/')
        asset_path = OpalWebpackLoader::Manifest.lookup_path_for(asset)
        "<script type=\"application/javascript\" src=\"#{asset_path}\"></script>"
      when 'development'
        "<script type=\"application/javascript\" src=\"#{'http://localhost:3035' + path[0..-4] + '_development' + path[-3..-1]}\"></script>"
      when 'test'
        real_path = path[0..-4] + '_test' + path[-3..-1]
        public, packs, asset = real_path.split('/')
        asset_path = OpalWebpackLoader::Manifest.lookup_path_for(asset)
        "<script type=\"application/javascript\" src=\"#{asset_path}\"></script>"
      end
    end
  end
end