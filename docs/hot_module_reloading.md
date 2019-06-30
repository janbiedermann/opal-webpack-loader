### Hot Module Reloading

#### HMR Demo

[![HMR Demo](https://img.youtube.com/vi/igF3cUsZrAQ/0.jpg)](https://www.youtube.com/watch?v=igF3cUsZrAQ)

(Recommended to watch in FullHD)

#### HMR and Ruby

When a module uses method aliasing and is reloaded, the aliases are applied again, which may lead to a endless recursion of method calls of
the aliased method once called after hot reloading.
To prevent that, the alias should be conditional, only be applied if the alias has not been applied before. Or alternatively the original
method must be restored before aliasing it again.
Because gems are not hot reloaded, this is not a issue for imported gems, but must be taken care of within the projects code.

Also it must be considered, that other code, which without hot reloading would only execute once during the programs life cycle, possibly will
execute many times when hot reloaded. "initialization code" should be guarded to prevent it from executing many times.

#### HMR Configuration

The opal-webpack-loader for webpack supports the following options to enable HMR:
(These are options for the webpack config, not to be confused with the owl ruby project options further down below)
```javascript
    loader: 'opal-webpack-loader',
    options: {
        hmr: true,
        hmrHook: 'global.Opal.ViewJS["$force_update!"]();'
    }
```

- `hmr` : enable (`true`) or disable (`false`) hot module reloading. Optional, default: `false`
- `hmrHook` : A javascript expression as string which will be executed after the new code has been loaded.
Useful to trigger a render or update for React or ViewJS projects.

Note: HMR works only for files within the project tree. Files outside the project tree are not hot reloaded.

#### HMR and RubyMine

Recommended Settings for RubyMine when sing HMR:
![RubyMine Settings](https://github.com/isomorfeus/opal-webpack-loader/blob/master/docs/RubyMine_settings.png?raw=true)