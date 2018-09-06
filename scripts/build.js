var webpack = require("webpack"),
    config = require("../config/webpack.prod.config");

process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

webpack(
  config,
  function (err) { if (err) throw err; }
);
