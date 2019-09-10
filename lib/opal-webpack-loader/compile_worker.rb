require 'socket'
require 'digest/sha1'

module OpalWebpackLoader
  class CompileWorker
    SIGNALS = %w[QUIT]

    attr_reader :number, :tempfile

    def initialize(master_pid, socket, tempfile, number, compiler_options)
      @master_pid = master_pid
      @socket     = socket
      @tempfile   = tempfile
      @number     = number
      @compiler   = CachedCompiler.new(compiler_options.merge(es6_modules: true))
    end

    def ==(other_number)
      number == other_number
    end

    def start
      $PROGRAM_NAME = "owl compile worker #{number}"
      SIGNALS.each { |sig| trap(sig, 'IGNORE') }
      trap('CHLD', 'DEFAULT')
      alive = true
      %w[TERM INT].each { |sig| trap(sig) { exit(0) } }
      trap('QUIT') do
        alive = false
        begin
          @socket.close
        rescue
          nil
        end
      end
      ret = nil
      i = 0
      while alive && @master_pid == Process.ppid
        tempfile.chmod(i += 1)

        if ret
          begin
            client = @socket.accept_nonblock
            request = client.gets("\x04")

            if request.start_with?('command:stop')
              OpalWebpackLoader::CompileServer.unlink_socket_on_exit
              Process.kill('TERM', @master_pid)
              exit(0)
            else
              result = handle_request(request)
              client.write result
              client.flush
              client.close
            end
          rescue Errno::EAGAIN, Errno::EWOULDBLOCK
          end
        end
        tempfile.chmod(i += 1)
        ret = begin
          IO.select([@socket], nil, nil, OpalWebpackLoader::CompileServer::TIMEOUT / 2) || next
        rescue Errno::EBADF
        end
      end
    end

    private

    def handle_request(request)
      request_json = Oj.load(request.chop!, {})
      filename = request_json["filename"]
      result = @compiler.compile(
        filename: filename,
        source: File.read(filename),
      ).tap do |result|
        result.merge('source_map' => nil) unless request_json["source_map"]
      end

      Oj.dump(result, mode: :strict)
    rescue Exception => e
      Oj.dump({ 'error' => { 'name' => e.class, 'message' => e.message, 'backtrace' => e.backtrace.join("\n") } }, {})
    end

    class CachedCompiler
      def initialize(compiler_options)
        @compiler_options = compiler_options
      end

      def cache
        @cache ||= {}
      end

      def compile(filename:, source:)
        options = @compiler_options.merge(file: filename)
        digest = Digest::SHA1.hexdigest(source)
        cached_digest, cached_result = cache[filename]

        if cached_digest == digest
          cached_result
        else
          compiler = Opal::Compiler.new(source, options)
          result = {
            'javascript' => compiler.compile,
            'source_map' =>  compiler.source_map.as_json.merge('file' => filename),
            'required_trees' => compiler.required_trees,
          }
          cache[filename] = [digest, result]
          result
        end
      end
    end
  end
end
