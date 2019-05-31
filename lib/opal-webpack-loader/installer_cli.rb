module OpalWebpackLoader
  module Installer
    TARGETS = %w[development.js production.js test.js]
    DEV_START_COMMAND = 'yarn run development'
    DEV_SM_START_COMMAND = 'yarn run sourcemaps'

    class CLI < Thor
      desc "iso", "Install owl configuration into a existing isomorfeus project, meant to be called from the isomorfeus installer only."
      # Showing directories and files relevant to iso owl:
      #   project_root
      #     +- config.ru # rack app starter
      #     +- config # webpack and other config
      #         +- owl.rb # owl.configuration
      #     +- isomorfeus
      #         +- components
      #         +- imports # javascript entrypoints, import other components etc.
      #              +- application.js
      #              +- application_common.js
      #              +- application_debug.js
      #              +- application_ssr.js
      #         +- isomorfeus_loader.rb
      #         +- models
      #         +- operations
      #         +- policies
      #         +- styles
      #              +- css
      #     +- log
      #     +- node_modules
      #     +- package.json
      #     +- Procfile
      #     +- public
      #          +- assets # compiled assets and other things
      #     +- spec
      #     +- tmp
      def iso
        @application_css = '../styles/application.css'
        @asset_output_directory = File.join('public', 'assets')
        @js_entrypoints_directory = File.join('isomorfeus', 'imports')
        @conf_rel_prefix = '..'
        @js_rel_prefix = '..'
        @opal_directory = 'isomorfeus'
        @styles_directory = File.join(@opal_directory, 'styles')
        @webpack_config_directory = 'webpack'
        @default_targets = 'browser, ssr'
        create_directory(@webpack_config_directory)
        create_directory(@asset_output_directory)
        FileUtils.touch(File.join(@asset_output_directory, '.keep'))
        install_webpack_config
        install_gitignore
        create_file_from_template('initializer.rb.erb', File.join('owl_init.rb'), { opal_load_path: '' })
        # add_gem
      end

      desc "flat", "Install owl configuration into a existing project with a flat structure, execute from the projects root directory."
      # <<~TEXT
      #   Showing directories and files relevant to owl:
      #     project_root
      #         +- owl_init.rb           # initializer for owl
      #         +- javascripts       # javascript entries directory
      #         +- node_modules     # directory for node modules
      #         +- opal             # directory for opal application files, can be changed with -o
      #         +- package.json     # package config for npm/yarn and their scripts
      #         +- public
      #             +- assets       # directory for compiled output files
      #         +- styles           # directory for stylesheets
      #         +- webpack          # directory for webpack configuration files
      #         +- Procfile         # config file for foreman
      #
      # TEXT
      option :opal_name, required: false, type: :string, default: 'opal', aliases: '-o', desc: <<~TEXT
        Set directory name for Opal source files.         
        Example: owl-installer rails -o isomorfeus  # will use project_root/app/isomorfeus for opal files
      TEXT

      def flat
        @application_css = '../styles/application.css'
        @asset_output_directory = File.join('public', 'assets')
        @js_entrypoints_directory = File.join('javascripts')
        @conf_rel_prefix = '..'
        @js_rel_prefix = '..'
        @opal_directory = options[:opal_name]
        @styles_directory = 'styles'
        @webpack_config_directory = 'webpack'
        @default_targets = 'browser'
        create_common_directories
        install_common_things
        create_file_from_template('application.css.erb', File.join('styles', 'application.css'), {})
        create_file_from_template('initializer.rb.erb', 'owl_init.rb', { opal_load_path: '' })
        create_file_from_template('app_loader.rb.erb', 'app_loader.rb', { opal_directory: @opal_directory })
        add_gem
        print_message
      end

      desc "rails", "Install owl configuration into a existing rails project without webpacker, execute from the projects root directory."
      # <<~TEXT
      #   Showing directories and files relevant to owl:
      #     project_root
      #         +- app
      #             +- assets
      #                 +- javascripts  # javascript entries directory
      #                 +- styles       # directory for stylesheets
      #             +- opal             # directory for opal application files, can be changed with -o
      #         +- config
      #             +- webpack          # directory for webpack configuration files
      #             +- initializers
      #                 +- owl.rb       # initializer for owl
      #         +- node_modules         # directory for node modules
      #         +- package.json         # package config for npm/yarn and their scripts
      #         +- public
      #             +- assets           # directory for compiled output files
      #         +- Procfile             # config file for foreman
      #
      # TEXT
      option :opal_name, required: false, type: :string, default: 'opal', aliases: '-o', desc: <<~TEXT
        Set directory name for Opal source files.        
        Example: owl-installer rails -o isomorfeus  # will use project_root/app/isomorfeus for opal files
      TEXT

      def rails
        @application_css = '../stylesheets/application.css'
        @asset_output_directory = File.join('public', 'assets')
        @js_entrypoints_directory = File.join('app', 'assets', 'javascripts')
        @conf_rel_prefix = File.join('..', '..')
        @js_rel_prefix = File.join('..', '..', '..')
        @opal_directory = File.join('app', options[:opal_name])
        @styles_directory = File.join('app', 'assets', 'stylesheets')
        @webpack_config_directory = File.join('config', 'webpack')
        @default_targets = 'browser'
        create_directory('app')
        create_common_directories
        install_common_things
        create_file_from_template('initializer.rb.erb', File.join('config', 'initializers', 'opal_webpack_loader.rb'),
                                  { opal_load_path: "Opal.append_path(File.realdirpath('#{@opal_directory}'))" })
        add_gem
        print_message
      end

      desc "webpacker", "Install owl configuration into a existing rails project with webpacker, execute from the projects root directory."
      # <<~TEXT
      #   Showing directories and files relevant to owl:
      #     project_root
      #         +- app
      #             +- assets
      #                 +- javascripts  # javascript entries directory
      #                 +- styles       # directory for stylesheets
      #             +- opal             # directory for opal application files, can be changed with -o
      #         +- config
      #             +- webpack          # directory for webpack configuration files
      #             +- initializers
      #                 +- owl.rb       # initializer for owl
      #         +- node_modules         # directory for node modules
      #         +- package.json         # package config for npm/yarn and their scripts
      #         +- public
      #             +- assets           # directory for compiled output files
      #         +- Procfile             # config file for foreman
      #
      # TEXT
      option :opal_name, required: false, type: :string, default: 'opal', aliases: '-o', desc: <<~TEXT
        Set directory name for Opal source files.        
        Example: owl-installer rails -o isomorfeus  # will use project_root/app/isomorfeus for opal files
      TEXT

      def webpacker
        @application_css = '../stylesheets/application.css'
        @asset_output_directory = File.join('public', 'assets')
        @js_entrypoints_directory = File.join('app', 'assets', 'javascripts')
        @conf_rel_prefix = File.join('..', '..')
        @js_rel_prefix = File.join('..', '..', '..')
        @opal_directory = File.join('app', options[:opal_name])
        @styles_directory = File.join('app', 'assets', 'stylesheets')
        @webpack_config_directory = File.join('config', 'webpack')
        @default_targets = 'browser'
        create_directory('app')
        create_common_directories
        install_webpacker_config
        install_webpacker_package_json
        install_webpacker_js_entry
        install_opal_entries
        install_gitignore
        create_file_from_template('initializer.rb.erb', File.join('config', 'initializers', 'opal_webpack_loader.rb'),
                                  { opal_load_path: "Opal.append_path(File.realdirpath('#{@opal_directory}'))" })
        add_gem
        print_message
      end

      private

      def create_directory(directory)
        unless Dir.exist?(directory)
          puts "Creating directory #{directory}."
          FileUtils.mkdir_p(directory)
        end
      end

      def create_common_directories
        create_directory(@webpack_config_directory)
        create_directory(@js_entrypoints_directory)
        create_directory(@opal_directory)
        create_directory(@asset_output_directory)
        FileUtils.touch(File.join(@asset_output_directory, '.gitkeep'))
        create_directory(@styles_directory)
      end

      def install_common_things
        install_webpack_config
        install_package_json
        install_js_entries
        install_opal_entries
        install_procfile
        install_gitignore
      end

      def install_gitignore
        if File.exist?('.gitignore')
          gitignore = File.read('.gitignore', more: 'r')
          unless gitignore.include?('.owl_cache')
            gitignore << "\n.owl_cache\n"
            File.write('.gitignore', gitignore)
          end
        end
      end

      def install_js_entries
        erb_hash = { opal_dir: File.join(@js_rel_prefix, @opal_directory), opal_name: options[:opal_name], application_css: @application_css }
        create_file_from_template('application.js.erb', File.join(@js_entrypoints_directory, 'application.js'), erb_hash)
        create_file_from_template('application_common.js.erb', File.join(@js_entrypoints_directory, 'application_common.js'),erb_hash)
        create_file_from_template('application_debug.js.erb', File.join(@js_entrypoints_directory, 'application_debug.js'), erb_hash)
        create_file_from_template('application_ssr.js.erb', File.join(@js_entrypoints_directory, 'application_ssr.js'), erb_hash)
        create_file_from_template('application_web_worker.js.erb', File.join(@js_entrypoints_directory, 'application_web_worker.js'), erb_hash)
      end

      def install_opal_entries
        create_file_from_template('opal_loader.rb.erb', File.join(@opal_directory, "#{options[:opal_name]}_loader.rb"), {})
        create_file_from_template('opal_web_worker_loader.rb.erb', File.join(@opal_directory, "#{options[:opal_name]}_web_worker_loader.rb"), {})
      end

      def install_package_json
        if File.exist?('package.json')
          gem_package_json_template = File.read(File.join(templates_path, 'package.json.erb'))
          gem_package_json = Oj.load(gem_package_json_template, mode: :strict)
          package_json_file = File.read('package.json')
          package_json = Oj.load(package_json_file, mode: :strict)
          package_json["scripts"] = {} unless package_json.has_key?("scripts")
          package_json["scripts"]["debug"] = debug_script
          package_json["scripts"]["development"] = development_script
          package_json["scripts"]["production_build"] = production_script
          package_json["devDependencies"] = {} unless package_json.has_key?("devDependencies")
          package_json["devDependencies"].merge!(gem_package_json["devDependencies"])
          package_json["dependencies"]["opal-webpack-loader"] = "^#{OpalWebpackLoader::VERSION}"
          File.write('package.json', Oj.dump(package_json, mode: :strict, indent: 2))
          puts "Updated package.json, updated scripts and owl dependencies"
        else
          erb_hash = {
            debug_script: debug_script,
            development_script: development_script,
            production_script: production_script,
            owl_version: OpalWebpackLoader::VERSION
          }
          create_file_from_template('package.json.erb', 'package.json', erb_hash)
        end
      end

      def install_procfile
        if File.exist?('Procfile')
          procfile = File.read('Procfile')
          has_webpack = false
          lines = procfile.lines
          lines.each do |line|
            has_webpack = true if line.start_with?('webpack')
          end
          unless has_webpack
            lines << 'webpack: yarn run development'
            File.write('Procfile', lines.join("\n"))
          end
        else
          erb_hash = { web_starter: '' }
          if @js_entrypoints_directory.start_with?('app')
            erb_hash[:web_starter] = 'web: bundle exec rails s'
          end
          create_file_from_template('Procfile.erb', 'Procfile',erb_hash)
        end
      end

      def debug_script
        "webpack-dev-server --config #{File.join(@webpack_config_directory, 'debug.js')}"
      end

      def development_script
        "webpack-dev-server --config #{File.join(@webpack_config_directory, 'development.js')}"
      end

      def production_script
        "webpack --config=#{File.join(@webpack_config_directory, 'production.js')}"
      end

      def install_webpack_config
        erb_hash = {
          asset_output_directory: File.join(@conf_rel_prefix, @asset_output_directory),
          default_targets: @default_targets,
          js_entry: File.join(@conf_rel_prefix, @js_entrypoints_directory, 'application.js'),
          js_common_entry: File.join(@conf_rel_prefix, @js_entrypoints_directory, 'application_common.js'),
          js_debug_entry: File.join(@conf_rel_prefix, @js_entrypoints_directory, 'application_debug.js'),
          js_ssr_entry: File.join(@conf_rel_prefix, @js_entrypoints_directory, 'application_ssr.js'),
          js_web_worker_entry: File.join(@conf_rel_prefix, @js_entrypoints_directory, 'application_web_worker.js'),
          opal_directory: File.join(@conf_rel_prefix, @opal_directory),
          stylesheets_directory: File.join(@conf_rel_prefix, @styles_directory),
          hmr_hook: ''
        }
        if @js_entrypoints_directory.start_with?('app')
          erb_hash[:dev_server_before] = <<~JAVASCRIPT
                // enable page reload for updates within the app/views directory
                before: function(app, server) {
                    chokidar.watch(path.resolve(__dirname, path.join('..', '..', 'app', 'views'))).on('all', function () {
                        server.sockWrite(server.sockets, 'content-changed');
                    })
                },
          JAVASCRIPT
        else
          erb_hash[:dev_server_before] = <<~JAVASCRIPT
                // uncomment to enable page reload for updates within another directory, which may contain just html files,
                // for example the 'views' directory:
                // before: function(app, server) {
                //     chokidar.watch(path.resolve(__dirname, path.join('..', 'views')).on('all', function () {
                //         server.sockWrite(server.sockets, 'content-changed');
                //     })
                // },
          JAVASCRIPT
        end
        create_file_from_template('debug.js.erb', File.join(@webpack_config_directory, 'debug.js'), erb_hash)
        create_file_from_template('development.js.erb', File.join(@webpack_config_directory, 'development.js'), erb_hash)
        create_file_from_template('production.js.erb', File.join(@webpack_config_directory, 'production.js'), erb_hash)
      end

      def install_webpacker_config
        environment_js = File.read(File.join('config', 'webpack', 'environment.js'), mode: 'r')
        new_environment_js = ''
        environment_js.lines.each do |line|
          new_environment_js << line
          if line.start_with?('const { environment }')
            new_environment_js << "\n"
            new_environment_js << File.read(File.join(templates_path, 'webpacker.js'), mode: 'r')
            new_environment_js << "\n"
          end
        end
        File.write(File.join('config', 'webpack', 'environment.js'), new_environment_js)
      end

      def install_webpacker_js_entry
        application_js = File.read(File.join('app', 'javascript', 'packs', 'application.js'), mode: 'r')
        application_js << <<~JAVASCRIPT
        
        // import and load opal ruby files
        import init_app from '#{options[:opal_name]}_loader.rb';
        init_app();
        Opal.load('#{options[:opal_name]}_loader');

        JAVASCRIPT
        File.write(File.join('app', 'javascript', 'packs', 'application.js'), application_js)
      end

      def install_webpacker_package_json
        package_json_file = File.read('package.json')
        package_json = Oj.load(package_json_file, mode: :strict)
        package_json["dependencies"]["opal-webpack-loader"] = "^#{OpalWebpackLoader::VERSION}"
        File.write('package.json', Oj.dump(package_json, mode: :strict, indent: 2))
        puts "Updated package.json for opal-webpack-loader"
      end

      def templates_path
        File.realpath(File.join(File.dirname(File.realpath(__FILE__)),  'templates'))
      end

      def create_file_from_template(template_path, target_file_path, data_hash)
        template = ERB.new(File.read(File.join(templates_path, template_path), mode: 'r'))
        result = template.result_with_hash(data_hash)
        if File.exist?(target_file_path)
          ext = '_owl_new'
          puts "#{target_file_path} exists, not overwriting, creating #{target_file_path + ext} instead."
        else
          ext = ''
          puts "Creating #{target_file_path}."
        end

        File.write(target_file_path + ext, result, mode: 'w')
      end

      def add_gem
        # TODO specifying a version results in bundler printing a error and not adding the gem
        # `bundle add opal-webpack-loader -v "#{OpalWebpackLoader::VERSION}" --skip-install`ß´
      end

      def print_message
        puts <<~TEXT
        
          Add the following lines to your Gemfile:

            gem 'opal', github: 'janbiedermann/opal', branch: 'es6_modules'
            gem 'opal-webpack-loader', '~> #{OpalWebpackLoader::VERSION}'

          owl currently works only with above opal branch. If you have a existing "gem 'opal'", please replace it with above line.

          Also check above output for files ending in '_owl_new' and merge their contents with the existing files.

          After that run according to your preference either:

            yarn install

          or:

            npm install
          
          and then:

            bundle install

          For further instructions see http://github.com/isomorfeus/opal-webpack-loader

        TEXT
      end
    end
  end
end
