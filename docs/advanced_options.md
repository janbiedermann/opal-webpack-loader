### Advanced Options

Advanced options to control the compiler can be configured in the webpack configuration, loader section.

The following options are available:
```javascript
    loader: 'opal-webpack-loader',
    options: {
        sourceMap: true,
        hmr: true,
        hmrHook: 'global.Opal.MyModule.$trigger_render()',
        includePaths:  ['../other/project/my_lib_directory'],
        requireModules: ['a_compiler_extension'],
        dynamicRequireSeverity: 'error',
        compilerFlagsOn: ['arity_check', 'freezing'],
        compilerFlagsOff: ['tainting'],
        memcached: true, // or:
        redis: true
    }
``` 

- `sourceMap`: see [Source Maps](https://github.com/isomorfeus/opal-webpack-loader/blob/master/docs/source_maps.md)
- `hmr`: see [Hot Module Reloading](https://github.com/isomorfeus/opal-webpack-loader/blob/master/docs/hot_module_reloading.md)
- `hmrHook`: see [Hot Module Reloading](https://github.com/isomorfeus/opal-webpack-loader/blob/master/docs/hot_module_reloading.md)
- `includePaths`: A array of paths for ruby to load compiler or compile server extensions from.
- `requireModules`: A array of ruby modules of compiler or compile server extensions to load.
- `dynamicRequireSeverity`: A opal compiler option, one of: 'error', 'warning', 'ignore'.
- `compilerFlagsOn`: A array of opal compiler flags to turn on, to set to true.
- `compilerFlagsOff`: A array of opal compiler flags to turn off, to set to false. 
- `memcached`: Can be either `true` or a memcached connect string like `localhost:12345`. Enables memcached as compiler cache.
- `redis`: Can be either `true` or a redis connect string like `redis://localhost:12345`. Enables redis as compiler cache.

Only one of the options of `memcached` or `redis` can be given. 
