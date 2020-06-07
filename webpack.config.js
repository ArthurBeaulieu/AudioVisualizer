module.exports = env => {
  // Js and CSS components
  const TerserPlugin = require('terser-webpack-plugin');
  const MiniCssExtractPlugin = require("mini-css-extract-plugin");
  const { CleanWebpackPlugin } = require('clean-webpack-plugin');
  const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
  const path = require('path');
  // Utils path
  const SRC = path.resolve(__dirname, '');
  const DIST = path.resolve(__dirname, 'dist');

  const cssLoaders = [{
    loader: 'css-loader',
    options: {
      importLoaders: 1
    }
  }, {
    loader: 'postcss-loader',
    options: {
      plugins: (loader) => [
        require('autoprefixer')({
          browserlist: ['last 2 versions']
        })
      ]
    }
  }];
  let entry = { audiovisualizer: ['./js/AudioVisualizer.js', './scss/audiovisualizer.scss'] };
  return {
    mode: 'production',
    watch: true,
    entry: entry,
    stats: {
      warnings: false,
    },
    devtool: false,
    output: {
      path: DIST,
      filename: `[name].${env.version}.js`
    },
    module: {
      rules: [{
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          ...cssLoaders,
          'sass-loader'
        ]
      }]
    },
    plugins: [
      new CleanWebpackPlugin(),
      new MiniCssExtractPlugin({
        filename: `[name].${env.version}.css`
      })
    ],
    resolve: {
      extensions: ['.js', '.scss'],
      modules: ['node_modules', SRC]
    },
    optimization: {
      minimizer: [
        new TerserPlugin({
          parallel: 4,
          terserOptions: {
            ecma: 5
          }
        }),
        new OptimizeCSSAssetsPlugin({
          assetNameRegExp: /\.css$/g,
          cssProcessor: require('cssnano'),
          cssProcessorPluginOptions: {
            preset: ['default', { discardComments: { removeAll: true } }]
          }
        })
      ]
    }
  };
};
