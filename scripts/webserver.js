var WebpackDevServer = require("webpack-dev-server"),
    webpack = require("webpack"),
    config = require("../config/webpack.dev.config"),
    env = require("../config/env"),
    path = require("path");

process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

var options = (config.chromeExtensionBoilerplate || {});
var excludeEntriesToHotReload = (options.notHotReload || []);

for (var entryName in config.entry) {
  config.entry[entryName] =
    [
      ("webpack-dev-server/client?http://localhost:" + env.PORT),
      "webpack/hot/dev-server"
    ].concat(config.entry[entryName]);
}

config.plugins =
  [new webpack.HotModuleReplacementPlugin()].concat(config.plugins || []);

var compiler = webpack(config);

var server =
  new WebpackDevServer(compiler, {
    hot: true,
    contentBase: path.join(__dirname, "../build"),
    headers: { "Access-Control-Allow-Origin": "*" }
  });

server.listen(env.PORT);
