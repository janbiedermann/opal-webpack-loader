module OpalWebpackLoader
  module RailsViewHelper
    def owl_script_tag(path)
      if OpalWebpackLoader.use_manifest
        asset = path.split('/').last
        asset_path = OpalWebpackLoader::Manifest.lookup_path_for(asset)
        javascript_include_tag("#{OpalWebpackLoader.client_asset_path}#{asset_path}")
      else
        javascript_include_tag("#{OpalWebpackLoader.client_asset_path}#{path}")
      end
    end
  end
end
