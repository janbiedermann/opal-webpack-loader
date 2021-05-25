require 'ffi'

module OpalWebpackLoader
  module WindowsyThings
    extend FFI::Library

    ffi_lib :kernel32, :user32

    ERROR_IO_PENDING      = 997
    ERROR_PIPE_CONNECTED  = 535
    ERROR_SUCCESS         = 0
    
    FILE_FLAG_OVERLAPPED  = 0x40000000
    
    INFINITE              = 0xFFFFFFFF
    INVALID_HANDLE_VALUE  = FFI::Pointer.new(-1).address

    PIPE_ACCESS_DUPLEX    = 0x00000003
    PIPE_READMODE_BYTE    = 0x00000000
    PIPE_READMODE_MESSAGE = 0x00000002
    PIPE_TYPE_BYTE        = 0x00000000
    PIPE_TYPE_MESSAGE     = 0x00000004
    PIPE_WAIT             = 0x00000000

    QS_ALLINPUT           = 0x04FF

    typedef :uintptr_t, :handle

    attach_function :ConnectNamedPipe, [:handle, :pointer], :ulong
    attach_function :CreateEvent, :CreateEventA, [:pointer, :ulong, :ulong, :string], :handle
    attach_function :CreateNamedPipe, :CreateNamedPipeA, [:string, :ulong, :ulong, :ulong, :ulong, :ulong, :ulong, :pointer], :handle
    attach_function :DisconnectNamedPipe, [:handle], :bool
    attach_function :FlushFileBuffers, [:handle], :bool
    attach_function :GetLastError, [], :ulong
    attach_function :GetOverlappedResult, [:handle, :pointer, :pointer, :bool], :bool
    attach_function :MsgWaitForMultipleObjects, [:ulong, :pointer, :ulong, :ulong, :ulong], :ulong
    attach_function :ReadFile, [:handle, :buffer_out, :ulong, :pointer, :pointer], :bool
    attach_function :SetEvent, [:handle], :bool
    attach_function :WaitForMultipleObjects, [:ulong, :pointer, :ulong, :ulong], :ulong
    attach_function :WriteFile, [:handle, :buffer_in, :ulong, :pointer, :pointer], :bool
  end

  class PipeServer
    include OpalWebpackLoader::WindowsyThings

    CONNECTING_STATE = 0
    READING_STATE    = 1
    WRITING_STATE    = 2
    INSTANCES        = 4
    PIPE_TIMEOUT     = 5000
    BUFFER_SIZE      = 65536

    class Overlapped < FFI::Struct
      layout(
        :Internal, :uintptr_t,
        :InternalHigh, :uintptr_t,
        :Offset, :ulong,
        :OffsetHigh, :ulong,
        :hEvent, :uintptr_t
      )
    end

    def initialize(pipe_name, instances = 4, &block)
      @run_block = block
      @full_pipe_name = "\\\\.\\pipe\\#{pipe_name}"
      @instances = instances
      @events = []
      @events_pointer = FFI::MemoryPointer.new(:uintptr_t, @instances)
      @pipes = []
    end

    def run
      create_instances
      while_loop
    end

    private

    def create_instances
      (0...@instances).each do |i|
        @events[i] = CreateEvent(nil, 1, 1, nil)
        raise "CreateEvent failed with #{GetLastError()}" unless @events[i]

        overlap = Overlapped.new
        overlap[:hEvent] = @events[i]

        @pipes[i] = { overlap: overlap, instance: nil, request: FFI::Buffer.new(1, BUFFER_SIZE), bytes_read: 0, reply: FFI::Buffer.new(1, BUFFER_SIZE), bytes_to_write: 0, state: nil, pending_io: false }
        @pipes[i][:instance] = CreateNamedPipe(@full_pipe_name, 
                                              PIPE_ACCESS_DUPLEX | FILE_FLAG_OVERLAPPED,
                                              PIPE_TYPE_MESSAGE | PIPE_READMODE_MESSAGE | PIPE_WAIT,
                                              @instances,
                                              BUFFER_SIZE,
                                              BUFFER_SIZE,
                                              PIPE_TIMEOUT,
                                              nil)

        raise "CreateNamedPipe failed with #{GetLastError()}" if @pipes[i][:instance] == INVALID_HANDLE_VALUE
        @pipes[i][:pending_io] = connect_to_new_client(i)
        @pipes[i][:state] = @pipes[i][:pending_io] ? CONNECTING_STATE : READING_STATE
      end
      @events_pointer.write_array_of_ulong_long(@events)
      nil
    end

    def while_loop
      while true
        i = MsgWaitForMultipleObjects(@instances, @events_pointer, 0, INFINITE, QS_ALLINPUT)
        # Having this STDOUT.putc is essential, otherwise there is a tendency to block within MsgWaitForMultipleObjects ...
        STDOUT.putc "."
        # ... because the ruby interpreter is waiting for objects too on Windows. Thats why we wait for QS_ALLINPUT and
        # with STDOUT.putc give back control to the ruby interpreter that it can handle its things.
        if i < 0 || i > (@instances - 1)
          STDERR.puts "Pipe index out of range. Maybe a error occured."
          next
        end

        if @pipes[i][:pending_io]
          bytes_transferred = FFI::MemoryPointer.new(:ulong)
          success = GetOverlappedResult(@pipes[i][:instance], @pipes[i][:overlap], bytes_transferred, false)

          case @pipes[i][:state]
          when CONNECTING_STATE
            raise "Error #{GetLastError()}" unless success
            @pipes[i][:state] = READING_STATE
          when READING_STATE
            if !success || bytes_transferred.read_ulong == 0
              disconnect_and_reconnect(i)
              next
            else
              @pipes[i][:bytes_read] = bytes_transferred.read_ulong
              @pipes[i][:state] = WRITING_STATE
            end
          when WRITING_STATE
            if !success || bytes_transferred.read_ulong != @pipes[i][:bytes_to_write]
              disconnect_and_reconnect(i)
              next
            else
              @pipes[i][:state] = READING_STATE
            end
          else
            raise "Invalid pipe state."
          end
        end

        case @pipes[i][:state]
        when READING_STATE
          bytes_read = FFI::MemoryPointer.new(:ulong)
          success = ReadFile(@pipes[i][:instance], @pipes[i][:request], BUFFER_SIZE, bytes_read, @pipes[i][:overlap].to_ptr)
          if success && bytes_read.read_ulong != 0
            @pipes[i][:pending_io] = false
            @pipes[i][:state] = WRITING_STATE
            next
          end

          err = GetLastError()
          if !success && err == ERROR_IO_PENDING
            @pipes[i][:pending_io] = true
            next
          end

          disconnect_and_reconnect(i)
        when WRITING_STATE
          @pipes[i][:reply] = @run_block.call(@pipes[i][:request].get_string(0))
          @pipes[i][:bytes_to_write] = @pipes[i][:reply].bytesize
          bytes_written = FFI::MemoryPointer.new(:ulong)
          success = WriteFile(@pipes[i][:instance], @pipes[i][:reply], @pipes[i][:bytes_to_write], bytes_written, @pipes[i][:overlap].to_ptr)

          if success && bytes_written.read_ulong == @pipes[i][:bytes_to_write]
            @pipes[i][:pending_io] = false
            @pipes[i][:state] = READING_STATE
            next
          end

          err = GetLastError()

          if !success && err == ERROR_IO_PENDING
            @pipes[i][:pending_io] = true
            next
          end

          disconnect_and_reconnect(i)
        else
          raise "Invalid pipe state."
        end
      end
    end

    def disconnect_and_reconnect(i)
      FlushFileBuffers(@pipes[i][:instance])
      STDERR.puts("DisconnectNamedPipe failed with #{GetLastError()}") if !DisconnectNamedPipe(@pipes[i][:instance])
  
      @pipes[i][:pending_io] = connect_to_new_client(i)
      
      @pipes[i][:state] = @pipes[i][:pending_io] ? CONNECTING_STATE : READING_STATE
    end

    def connect_to_new_client(i)
      pending_io = false
      @pipes[i][:request].clear
      @pipes[i][:reply].clear
      connected = ConnectNamedPipe(@pipes[i][:instance], @pipes[i][:overlap].to_ptr)
      last_error = GetLastError()
      raise "ConnectNamedPipe failed with #{last_error} - #{connected}" if connected != 0
      
      case last_error
      when ERROR_IO_PENDING
        pending_io = true
      when ERROR_PIPE_CONNECTED
        SetEvent(@pipes[i][:overlap][:hEvent])
      when ERROR_SUCCESS
        pending_io = true
      else
        raise "ConnectNamedPipe failed with error #{last_error}"
      end

      pending_io
    end
  end
end
