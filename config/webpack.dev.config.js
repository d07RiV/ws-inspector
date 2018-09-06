var webpack = require("webpack"),
    path = require("path"),
    fileSystem = require("fs"),
    env = require("./env"),
    CleanWebpackPlugin = require("clean-webpack-plugin"),
    CopyWebpackPlugin = require("copy-webpack-plugin"),
    HtmlWebpackPlugin = require("html-webpack-plugin"),
    WriteFilePlugin = require("write-file-webpack-plugin");

var fileExtensions = ["jpg", "jpeg", "png", "gif", "eot", "otf", "svg", "ttf", "woff", "woff2"];

var appDir = path.join(__dirname, "..");
var srcDir = path.join(appDir, "src");

var options = {
  entry: {
    background: path.join(srcDir, "background.js"),
    inspector: path.join(srcDir, "inspector.js"),
  },
  output: {
    path: path.join(appDir, "build"),
    filename: "[name].bundle.js"
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        loader: "style-loader!css-loader",
        exclude: /node_modules/
      },
      {
        test: /\.scss$/,
        use: [
          "style-loader",
          "css-loader",
          "sass-loader"
        ],
        exclude: /node_modules/
      },
      {
        test: new RegExp('\.(' + fileExtensions.join('|') + ')$'),
        loader: "file-loader?name=[name].[ext]",
        exclude: /node_modules/
      },
      {
        test: /\.html$/,
        loader: "html-loader",
        exclude: /node_modules/
      },
      {
        test: /\.(js|jsx)$/,
        loader: "babel-loader",
        exclude: /node_modules/,
        options: {
          babelrc: false,
          presets: [
            require.resolve('@babel/preset-env'),
            require.resolve('@babel/preset-react'),
          ],
          plugins: [
            require.resolve('@babel/plugin-proposal-class-properties'),
          ],
          cacheDirectory: true,
        },
      }
    ]
  },
  plugins: [
    // clean the build folder
    new CleanWebpackPlugin(["build"]),
    // expose and write the allowed env vars on the compiled bundle
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(env.NODE_ENV)
    }),
    new CopyWebpackPlugin([{
      from: "src/manifest.json",
      transform: function (content, path) {
        // generates the manifest file using the package.json informations
        return Buffer.from(JSON.stringify({
          description: process.env.npm_package_description,
          version: process.env.npm_package_version,
          ...JSON.parse(content.toString())
        }))
      }
    }]),
    new HtmlWebpackPlugin({
      template: path.join(srcDir, "background.html"),
      filename: "background.html",
      chunks: ["background"]
    }),
    new HtmlWebpackPlugin({
      template: path.join(srcDir, "inspector.html"),
      filename: "inspector.html",
      chunks: ["inspector"]
    }),
    new WriteFilePlugin()
  ],
  devtool: "inline-module-source-map"
};

module.exports = options;
