const webpack = require("webpack");
const path = require("path");

module.exports = {
    entry: {
        index: "./app.js",
    },
    output: {
        path: path.join(__dirname, "build"),
        filename: "glo.js"
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: ['babel-loader'],
            },
            {
                test: /\.scss$/,
                use: [
                    {
                        loader: "style-loader",
                    },
                    {
                        loader: "css-loader",
                    },
                    {
                        loader: "sass-loader",
                    }
                ]
            },
        ],
    },
    mode: "development",
    devtool: "inline-source-map",
    resolve: {
        extensions: ['*', '.js', '.jsx']
    },
};
