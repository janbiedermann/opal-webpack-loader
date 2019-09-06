// begin # added by the owl-install
const OwlResolver = require('opal-webpack-loader/resolver'); // to resolve ruby files

const owl_resolver = {
    resolve: {
        plugins: [
            // this makes it possible for webpack to find ruby files
            new OwlResolver('resolve', 'resolved')
        ]
    }
};
environment.config.merge(owl_resolver);

const opal_loader = {
    // opal-webpack-loader will compile and include ruby files in the pack
    test: /(\.js)?\.rb$/,
    use: [
        {
            loader: 'opal-webpack-loader',
            options: {
                sourceMap: false,
                hmr: false,
                hmrHook: '' // see opal-webpack-loader docs
            }
        }
    ]
};

environment.loaders.append('opal', opal_loader);
// end # added by owl-install
