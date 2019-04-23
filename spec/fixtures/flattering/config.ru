require './app_loader.rb'

class App < Roda


  route do |r|
    r.root do
      <<~HTML
      <html>
        <head>
          <title>Welcome</title>
        </head>
        <body>
          <div>Hello world!</div>
        </body>
      </html>
      HTML
    end
  end
end

run App.app