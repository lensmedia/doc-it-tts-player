const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
    entry: {
        js: './src/Main.ts',
        css: './assets/scss/main.scss',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name]/tts-player.js',
        libraryTarget: 'umd',
        globalObject: 'this',
        library: 'TtsPlayer',
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
                exclude: /node_modules/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            // bit ugly but it is to keep it relative to the
                            // assets/... folder instead of to the root.
                            publicPath: '../../'
                        }
                    },
                    {
                        loader: 'css-loader',
                        options: { sourceMap: true },
                    },
                    { loader: 'postcss-loader' },
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true,
                        },
                    },
                ],
            },
        ],
    },
    optimization: {
        minimizer: [
            '...',
            new CssMinimizerPlugin({
                minimizerOptions: {
                    preset: [
                        'default',
                        { calc: false },
                    ]
                }
            }),
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    devtool: 'source-map',
    devServer: {
        host: '0.0.0.0',
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'css/tts-player.css',
        }),
    ],
};
