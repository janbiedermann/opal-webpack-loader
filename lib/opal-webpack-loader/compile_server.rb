require 'socket'
require 'tempfile'

module OpalWebpackLoader
  class CompileServer
    SIGNALS = %w[QUIT INT TERM]
    TIMEOUT = 15

    def self.unlink_socket?
      @unlink
    end

    def self.unlink_socket_on_exit
      @unlink = true
    end

    def self.dont_unlink_socket_on_exit
      @unlink = false
    end

    def self.stop(socket_path, do_exit = true)
      if File.exist?(socket_path)
        dont_unlink_socket_on_exit
        begin
          s = UNIXSocket.new(socket_path)
          s.send("command:stop\x04", 0)
          s.close
        rescue
          # socket cant be reached so owlcs is already dead, delete socket
          unlink_socket_on_exit
        end
        exit(0) if do_exit
      end
    end

    def initialize
      @read_pipe, @write_pipe = IO.pipe
      @workers = {}
      @signal_queue = []
    end

    def start(number_of_workers = 4, compiler_options, socket_path)
      $PROGRAM_NAME = 'owl compile server'
      @number_of_workers = number_of_workers
      @server_pid = Process.pid
      $stderr.sync = $stdout.sync = true
      @socket = UNIXServer.new(socket_path)
      spawn_workers(compiler_options)
      SIGNALS.each { |sig| trap_deferred(sig) }
      trap('CHLD') { @write_pipe.write_nonblock('.') }

      loop do
        reap_workers
        mode = @signal_queue.shift
        case mode
        when nil
          kill_runaway_workers
          spawn_workers(compiler_options)
        when 'QUIT', 'TERM', 'INT'
          @workers.each_pair do |pid, _worker|
            Process.kill('TERM', pid)
          end
          break
        end
        reap_workers
        ready = IO.select([@read_pipe], nil, nil, 1) || next
        ready.first && ready.first.first || next
        @read_pipe.read_nonblock(1)
        OpalWebpackLoader::CompileServer.unlink_socket_on_exit
      end
    end

    private

    def reap_workers
      loop do
        pid, status = Process.waitpid2(-1, Process::WNOHANG) || break
        reap_worker(pid, status)
      end
    rescue Errno::ECHILD
    end

    def reap_worker(pid, status)
      worker = @workers.delete(pid)
      begin
        worker.tempfile.close
      rescue
        nil
      end
      puts "OpalWebpackLoader::CompileServer: Reaped worker #{worker.number} (PID:#{pid}) status: #{status.exitstatus}"
    end

    def kill_worker(signal, pid)
      Process.kill(signal, pid)
    rescue Errno::ESRCH
    end

    def kill_runaway_workers
      now = Time.now
      @workers.each_pair do |pid, worker|
        (now - worker.tempfile.ctime) <= TIMEOUT && next
        $stderr.puts "worker #{worker.number} (PID:#{pid}) has timed out"
        kill_worker('KILL', pid)
      end
    end

    def init_worker(worker)
      @write_pipe.close
      @read_pipe.close
      @workers.each_pair { |_, w| w.tempfile.close }
      worker.start
    end

    def spawn_workers(compiler_options)
      worker_number = -1
      until (worker_number += 1) == @number_of_workers
        @workers.value?(worker_number) && next
        tempfile = Tempfile.new('')
        tempfile.unlink
        tempfile.sync = true
        worker = OpalWebpackLoader::CompileWorker.new(@server_pid, @socket, tempfile, worker_number, compiler_options)
        pid = fork { init_worker(worker) }
        @workers[pid] = worker
      end
    end

    def trap_deferred(signal)
      trap(signal) do |_|
        @signal_queue << signal
        @write_pipe.write_nonblock('.')
      end
    end
  end
end