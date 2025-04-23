// paths.cjs
const path = require('path');
require('tsconfig-paths/register');

module.exports = {
  resolve: {
    alias: {
      '/utils': path.resolve(__dirname, './dist/utils'),
      '@services': path.resolve(__dirname, './dist/services')
    }
  }
};