const path = require('path');

module.exports = {
  entry: {
    vendor: [
      'chart.js/auto', // Add other dependencies here if needed
    ],
  },
  output: {
    filename: 'vendor.bundle.js',
    path: path.resolve(__dirname, 'client', 'dist'),
    libraryTarget: 'umd', // Universal Module Definition
  },
  mode: 'production',
};
