module OpalWebpackLoader
  module RailsViewHelper
    def owl_include_tag(path)
      case Rails.env
      when 'development'
        javascript_include_tag("http://localhost:3035#{OpalWebpackLoader.client_asset_path}/#{path}")
      else
        asset = path.split('/').last
        asset_path = OpalWebpackLoader::Manifest.lookup_path_for(asset)
        javascript_include_tag("#{OpalWebpackLoader.client_asset_path}/#{asset_path}")
      end
    end
  end
end
