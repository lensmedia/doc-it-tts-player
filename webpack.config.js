const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const filename = 'tts-player';

module.exports = {
    entry: {
        ['js/' + filename]: './src/Main.ts',
        ['css/' + filename]: './assets/scss/main.scss',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        library: 'TtsPlayer',
        libraryTarget: 'var',
    },
    module: {
        rules: [
            {
                test: /\.[jt]sx?$/,
                use: 'babel-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.s?css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'postcss-loader',
                    'sass-loader',
                ],
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    devServer: {
        host: '0.0.0.0',
    },
    plugins: [
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin(),
    ],
};
