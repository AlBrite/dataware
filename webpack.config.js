const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  devtool: 'source-map',

  output: {
    // Filename for the output file
    filename: 'index.iife.min.js',

    // Path where the output files will be stored
    path: path.resolve(__dirname, 'dist'),

    // UMD setup for global export
    
    libraryTarget: 'umd',
  },

  mode: 'development', //'production',

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({ 
        terserOptions: {
          compress: {
            drop_console: true,
          },
        },
      }),
    ],
  },


   // Development server (for local development)
   devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true, // Enable gzip compression for faster loading
    port: 9000, // You can change the port
    open: true, // Open the browser automatically after starting the server
    hot: true, // Enable hot module replacement (HMR)
    watchContentBase: true, // Watch for changes in static files
    overlay: true, // Show a full-screen overlay in the browser for build errors
  },
};
