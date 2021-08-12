module OpalWebpackLoader
  class NodeWorker
    def self.compile(source, filename, compile_source_map, compiler_options, cache)
      begin
        result = {}
        c = Opal::Compiler.new(source, compiler_options.merge(file: filename))
        result[:javascript] = c.compile
        if compile_source_map
          result[:source_map] = c.source_map.as_json.to_n
          result[:source_map][:file] = filename
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
