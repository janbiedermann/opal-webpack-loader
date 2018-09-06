module OpalWebpackLoader
  class Manifest
    def self.manifest
      @manifest ||= JSON.parse(File.read(File.join(Rails.root, 'public', 'packs', 'manifest.json')))
    end

    def self.lookup_path_for(asset)
      manifest[asset]
    end
  end
end