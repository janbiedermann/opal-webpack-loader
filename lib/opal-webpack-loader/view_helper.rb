module OpalWebpackLoader
  module ViewHelper
    def owl_script_tag(path)
      if OpalWebpackLoader.use_manifest
        asset_path = OpalWebpackLoader::Manifest.lookup_path_for(path)
        "<script type=\"application/javascript\" src=\"#{OpalWebpackLoader.client_asset_path}#{asset_path}\"></script>"
      else
        "<script type=\"application/javascript\" src=\"#{OpalWebpackLoader.client_asset_path}#{path}\"></script>"
      end
    end
  end
end
