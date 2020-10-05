module.exports = env => {
  // Webpack clean and uglify plugins
  const path = require('path');
  const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
  const MiniCssExtractPlugin = require('mini-css-extract-plugin');
  const { CleanWebpackPlugin } = require('clean-webpack-plugin');
  // Utils path
  const SRC = path.resolve(__dirname, 'src');
  const DIST = path.resolve(__dirname, 'dist');
  // CSS loaders to be used on compilation
  const cssLoader = {
    loader: 'css-loader',
    options: {
      importLoaders: 1
    }
  };
  // Webpack configuration object
  return {
    mode: env.dev === 'true' ? 'development' : 'production',
    watch: env.dev === 'true',
    entry: ['./src/js/AudioVisualizer.js', './src/scss/audiovisualizer.scss'],
    stats: {
      warnings: env.dev === 'true',
    },
    devtool: false,
    output: {
      path: DIST,
      filename: `AudioVisualizer.min.js`
    },
    module: {
      rules: [{
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          cssLoader,
          'sass-loader'
        ]
      }, (env.dev === 'true') ? {} : {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }]
    },
    plugins: [
      new CleanWebpackPlugin({
        root: DIST,
        verbose: true,
        dry: false
      }),
      new MiniCssExtractPlugin({
        filename: 'audiovisualizer.min.css'
      })
    ],
    resolve: {
      extensions: ['.js', '.scss'],
      modules: ['node_modules', SRC]
    }
  };
};
