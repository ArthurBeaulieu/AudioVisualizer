'use strict';

const webpack = require('webpack');
const loaders = require('../webpack/loaders');
const plugins = require('../webpack/plugins');

module.exports = config => {
  config.set({
    basePath: '../',
    singleRun: !config.dev, // Keep browser open in dev mode
    browsers: ['Firefox'], // TODO optionnaly launch browsers
    frameworks: ['jasmine'],
    client: {
      jasmine: {
        random: !config.dev // Randomly run test when not developping them
      }
    },
    files: [
      'test/testContext.js',
      {
        pattern: 'demo/audio/*',
        included: false,
        served: true,
        nocache: false
      }
    ],
    reporters: ['progress'],
    preprocessors: {
      'test/testContext.js': ['webpack']
    },
    babelPreprocessor: {
      options: {
        presets: ['env'],
        sourceMap: false
      }
    },
    webpack: {
      devtool: false,
      module: {
        rules: [
          loaders.JSLoader,
          loaders.CSSLoader
        ]
      },
      plugins: [
        new webpack.ProgressPlugin(),
        plugins.CleanWebpackPlugin,
        plugins.ESLintPlugin,
        plugins.StyleLintPlugin,
        plugins.MiniCssExtractPlugin
      ],
      watch: true,
      mode: 'development'
    },
    webpackServer: {
      noInfo: true
    }
  });
};
