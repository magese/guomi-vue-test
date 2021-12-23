'use strict'
const path = require("path");

function resolve(dir) {
  return path.join(__dirname, dir)
}

const port = 8099

module.exports = {

  publicPath: './',
  outputDir: 'dist',
  assetsDir: 'static',
  lintOnSave: false,
  productionSourceMap: false,

  devServer: {
    port: port,
    open: true,
    overlay: {
      warnings: false,
      errors: true
    }
  },
  configureWebpack: {
    name: 'guomi-test',
    resolve: {
      alias: {
        '@': resolve('src')
      }
    }
  }
}
