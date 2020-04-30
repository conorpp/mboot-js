const path = require('path');

module.exports = {
  entry: './src/client.js',
  output: {
    filename: 'mboot.js',
    library: 'mboot', 
    path: path.resolve(__dirname, 'dist'),
  },
};