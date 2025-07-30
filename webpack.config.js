const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const path = require('path');

module.exports = {
    mode: 'production',
    entry: {
        'tts-player': './src/Main.ts',
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
        library: {
            name: 'TtsPlayer',
            type: 'umd',
            export: 'default',
        },
    },
    module: {
        rules: [ {
            test: /\.[tj]s$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader'
            }
        }, {
            test: /\.(c|s[ac])ss$/i,
            use: [
                MiniCssExtractPlugin.loader,
                'css-loader',
                'sass-loader',
            ],
        }, {
            test: /\.(png|gif|jpg|jpeg|svg|ttf|eot|woff2|mp\d|mov|mpe?g|avi|mkv)$/,
            exclude: /node_modules/,
            type: 'asset/resource',
            generator: {
                filename: module => module.filename.replace(/^assets\//, ''),
            },
        }, {
            resourceQuery: /source|inline|raw/,
            type: 'asset/source',
        }]
    },
    resolve: {
        extensions: [ '.vue', '.ts', '.js', '.scss' ],
    },
    plugins: [
        new MiniCssExtractPlugin(),
    ],
};
