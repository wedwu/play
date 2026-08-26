const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    "poker-panel": path.resolve(__dirname, "src/poker-panel/index.tsx")
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: "ts-loader", exclude: /node_modules/ },
      { test: /\.css$/, use: ["style-loader", "css-loader"] }
    ]
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist")
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: "poker-panel.html",
      chunks: ["poker-panel"],
      template: path.resolve(__dirname, "src/poker-panel/template.html")
    }),
    new CopyWebpackPlugin({
      patterns: [{ from: "img", to: "../img", noErrorOnMissing: true }]
    })
  ],
  devtool: "source-map"
};
