module OpalWebpackLoader
  class Manifest
    def self.manifest
      @manifest ||= JSON.parse(File.read(OpalWebpackLoader.manifest_path))
    end

    def self.lookup_path_for(asset)
      manifest[asset]
    end
  end
end
