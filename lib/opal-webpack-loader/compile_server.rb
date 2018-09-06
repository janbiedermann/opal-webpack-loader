require 'oj'
require 'eventmachine'
require 'opal/paths'
require 'opal/source_map'
require 'source_map'
require 'opal/compiler'
require 'socket'

at_exit do
  if OpalWebpackCompileServer::Exe.unlink_socket?
    if File.exist?(OpalWebpackCompileServer::OWCS_SOCKET_PATH)
      File.unlink(OpalWebpackCompileServer::OWCS_SOCKET_PATH)
    end
  end
end

module OpalWebpackCompileServer
  OWL_CACHE_DIR = './.owl_cache/'
  OWL_LP_CACHE = OWL_CACHE_DIR + 'load_paths.json'
  OWCS_SOCKET_PATH = OWL_CACHE_DIR + 'owcs_socket'

  class Compiler < EventMachine::Connection
    def receive_data(data)
      if data.start_with?('command:stop')
        EventMachine.stop
        exit(0)
      end

      filename = data.chop # remove newline

      operation = proc do
        begin
          source = File.read(filename)
          c = Opal::Compiler.new(source, file: filename, es6_modules: true)
          c.compile
          result = { 'javascript' => c.result }
          result['source_map'] = c.source_map.as_json
          result['source_map']['sourcesContent'] = [source]
          result['source_map']['file'] = filename
          result['source_map']['names'] = result['source_map']['names'].map(&:to_s)
          result['required_trees'] = c.required_trees
          Oj.dump(result)
        rescue Exception => e
          Oj.dump({ 'error' => { 'name' => e.class, 'message' => e.message, 'backtrace' => e.backtrace } })
        end
      end

      callback = proc do |json|
        self.send_data(json + "\n")
        close_connection_after_writing
      end

      EM.defer(operation, callback)
    end
  end

  class LoadPathManager
    def self.get_load_path_entries(path)
      path_entries = []
      return [] unless Dir.exist?(path)
      dir_entries = Dir.entries(path)
      dir_entries.each do |entry|
        next if entry == '.'
        next if entry == '..'
        absolute_path = File.join(path, entry)
        if File.directory?(absolute_path)
          more_path_entries = get_load_path_entries(absolute_path)
          path_entries.push(*more_path_entries) if more_path_entries.size > 0
        elsif (absolute_path.end_with?('.rb') || absolute_path.end_with?('.js')) && File.file?(absolute_path)
          path_entries.push(absolute_path)
        end
      end
      path_entries
    end

    def self.get_load_paths
      load_paths = if File.exist?('bin/rails')
                     %x{
                       bundle exec rails runner "puts (Rails.configuration.respond_to?(:assets) ? (Rails.configuration.assets.paths + Opal.paths).uniq : Opal.paths)"
                     }
                   else
                     %x{
                       bundle exec ruby -e 'require "bundler/setup"; Bundler.require; puts Opal.paths'
                     }
                   end
      if $? == 0
        load_path_lines = load_paths.split("\n")
        load_path_lines.pop if load_path_lines.last == ''

        load_path_entries = []

        cwd = Dir.pwd

        load_path_lines.each do |path|
          next if path.start_with?(cwd)
          more_path_entries = get_load_path_entries(path)
          load_path_entries.push(*more_path_entries) if more_path_entries.size > 0
        end
        cache_obj = { 'opal_load_paths' => load_path_lines, 'opal_load_path_entries' => load_path_entries }
        Dir.mkdir(OpalWebpackCompileServer::OWL_CACHE_DIR) unless Dir.exist?(OpalWebpackCompileServer::OWL_CACHE_DIR)
        File.write(OpalWebpackCompileServer::OWL_LP_CACHE, Oj.dump(cache_obj))
        load_path_lines
      else
        raise 'Error getting load paths!'
        exit(2)
      end
    end
  end

  class Exe
    def self.unlink_socket?
      @unlink
    end

    def self.unlink_on_exit
      @unlink = true
    end

    def self.dont_unlink_on_exit
      @unlink = false
    end

    def self.stop
      if File.exist?(OWCS_SOCKET_PATH)
        dont_unlink_on_exit
        begin
          s = UNIXSocket.new(OWCS_SOCKET_PATH)
          s.send("command:stop\n", 0)
          s.close
        rescue
          # socket cant be reached so owcs is already dead, delete socket
          unlink_on_exit
        end
        exit(0)
      end
    end

    def self.run
      if File.exist?(OWCS_SOCKET_PATH) # OWCS already running
        puts 'Another Opal Webpack Compile Server already running, exiting'
        dont_unlink_on_exit
        exit(1)
      else
        unlink_on_exit
        load_paths = OpalWebpackCompileServer::LoadPathManager.get_load_paths
        if load_paths
          Opal.append_paths(*load_paths)
          Process.daemon(true)
          EventMachine.run do
            EventMachine.start_unix_domain_server(OWCS_SOCKET_PATH, OpalWebpackCompileServer::Compiler)
          end
        end
      end
    end
  end
end
