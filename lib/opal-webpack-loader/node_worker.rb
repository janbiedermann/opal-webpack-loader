module OpalWebpackLoader
  class NodeWorker
    def self.init(paths)
      Opal.append_paths(*paths)
    end

    def self.compile(filename, source, compile_source_map, compiler_options)
      begin
        result = {}
        c = Opal::Compiler.new(source, compiler_options)
        result[:javascript] = c.compile
        if compile_source_map
          source_map = c.source_map.as_json
          source_map[:file] = filename
          result[:source_map] = source_map.to_n
        else
          result[:source_map] = `null`
        end
        result[:required_trees] = c.required_trees.to_n
        result.to_n
      rescue Exception => e
        { :error => {
           :name => e.class.to_s,
           :message => e.message, 
           :backtrace => e.backtrace.join("\n")
        }}.to_n
      end
    end
  end
end
