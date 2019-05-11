### Source Maps

#### Source Map Demo
[![SourceMap Demo](https://img.youtube.com/vi/SCmDYu_MLQU/0.jpg)](https://www.youtube.com/watch?v=SCmDYu_MLQU)

It shows a exception during a page load. In the console tab of the browsers developer tools, the error message is then expanded and just by clicking
on the shown file:line_numer link, the browser shows the ruby source code, where the exception occured.

#### Source Map Configuration

The opal-webpack-loader for webpack supports the following options to enable HMR:
(These are options for the webpack config, not to be confused with the owl ruby project options further down below)
```javascript
    loader: 'opal-webpack-loader',
    options: {
        sourceMap: true
    }
```

- `sourceMap` : enable (`true`) or disable (`false`) source maps. Optional, default: `false`

Also source maps must be enabled in webpack. See [webpack devtool configuration](https://webpack.js.org/configuration/devtool).
