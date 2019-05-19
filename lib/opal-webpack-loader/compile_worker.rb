require 'socket'

module OpalWebpackLoader
  class CompileWorker
    SIGNALS = %w[QUIT]

    attr_reader :number, :tempfile

    def initialize(master_pid, socket, tempfile, number, compiler_options)
      @master_pid = master_pid
      @socket     = socket
      @tempfile   = tempfile
      @number     = number
      @compiler_options = compiler_options.merge(es6_modules: true)
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
              result = compile(request)
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

    def compile(request)
      request_json = Oj.load(request.chop!, {})

      compile_source_map = request_json["source_map"]
      filename = request_json["filename"]
      source = File.read(filename)

      begin
        c = Opal::Compiler.new(source, @compiler_options.merge(file: filename))
        result = { 'javascript' => c.compile }
        if compile_source_map
          result['source_map'] = c.source_map.as_json
          result['source_map']['file'] = filename
        end
        result['required_trees'] = c.required_trees
        Oj.dump(result, mode: :strict)
      rescue Exception => e
        Oj.dump({ 'error' => { 'name' => e.class, 'message' => e.message, 'backtrace' => e.backtrace.join("\n") } }, {})
      end
    end
  end
end