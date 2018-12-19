module OpalWebpackLoader
  module ViewHelper
    def owl_include_tag(path, env = 'development')
      case env
      when 'development'
        "<script type=\"application/javascript\" src=\"http://localhost:3035#{OpalWebpackLoader.client_asset_path}/#{path}\"></script>"
      else
        asset_path = OpalWebpackLoader::Manifest.lookup_path_for(path)
        "<script type=\"application/javascript\" src=\"#{OpalWebpackLoader.client_asset_path}/#{asset_path}\"></script>"
      end
    end
  end
end
