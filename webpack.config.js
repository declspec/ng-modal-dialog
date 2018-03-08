const path = require('path');
const webpack = require('webpack');

const LibraryName = 'ng-modal-dialog';
const MinLibraryName = `${LibraryName}.min`;

module.exports = {
    entry: {
        [LibraryName]: './src/lib.js',
        [MinLibraryName]: './src/lib.js'
    },

    output: {
        path: path.resolve('./bin'),
        publicPath: 'bin/',
        filename: '[name].js',
        library: LibraryName,
        libraryTarget: 'umd'
    },

    resolve: {
        extensions: [ '.webpack.js', '.web.js', '.js' ]
    },

    module: {
        loaders: [
            { 
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015']
                }
            }
        ]
    },

    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            include: /\.min\.js$/,
            minimize: true,
            mangle: {
                screw_ie8: true,
                keep_fnames: false
            },
            compress: {
                screw_ie8: true,
                warnings: false
            }
        })
    ]
};
