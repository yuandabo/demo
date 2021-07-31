/* eslint-disable @typescript-eslint/no-var-requires */
var { resolve } = require('path')
var webpack = require('webpack')
// var HtmlWebpackPlugin = require('html-webpack-plugin')
// var CopyWebpackPlugin = require('copy-webpack-plugin')
const AddAssetHtmlWebpackPlugin = require('add-asset-html-webpack-plugin')
// const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin')
module.exports = {
  publicPath: './',
  productionSourceMap: false,
  devServer: {
    port: 9523,
    // open: true,
    overlay: {
      warnings: false,
      errors: true
    },
    proxy: {
      // 本系统
      '/services/app': {
        target: 'http://192.168.203.201:7003',
        changeOrigin: true
      },
      // 本系统
      '/services/login': {
        target: 'http://192.168.203.201:7000',
        changeOrigin: true
      }
    }
  },
  transpileDependencies: ['vuex-module-decorators'],
  css: {
    loaderOptions: {
      sass: {
        prependData: `
          @import "~@/styles/_variables.scss";
          @import "~@/styles/_mixins.scss";
        `
      }
    }
  },
  configureWebpack: {
    devtool: 'source-map',
    plugins: [
      //
      new webpack.DllReferencePlugin({
        context: __dirname,
        manifest: require('./vendor-manifest.json')
      }),
      // new CopyWebpackPlugin([
      //   { from: 'static', to: 'static' }
      // ]),
      new AddAssetHtmlWebpackPlugin({
        filepath: resolve(__dirname, './static/js/vendor.dll.js')
      })
    ]
  },
  chainWebpack(config) {
    // it can improve the speed of the first screen, it is recommended to turn on preload
    config.plugin('preload').tap(() => [
      {
        rel: 'preload',
        // https://github.com/vuejs/vue-cli/blob/dev/packages/@vue/cli-service/lib/config/app.js#L171
        fileBlacklist: [/\.map$/, /hot-update\.js$/, /runtime\..*\.js$/],
        include: 'initial'
      }
    ])

    // 打包成单文件
    // config.plugin('html').tap(args => {
    //   args[0].inlineSource = '.(js|css)$'
    //   return args
    // })
    // config.plugin('HtmlWebpackInlineSourcePlugin').use(HtmlWebpackInlineSourcePlugin)

    config.when(process.env.NODE_ENV !== 'development', (config) => {
      config.optimization.splitChunks({
        chunks: 'all',
        cacheGroups: {
          // libs: {
          //   name: 'chunk-libs',
          //   test: /[\\/]node_modules[\\/]/,
          //   priority: 10,
          //   chunks: 'initial' // only package third parties that are initially dependent
          // },
          // elementUI: {
          //   name: 'chunk-elementUI', // split elementUI into a single package
          //   priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
          //   test: /[\\/]node_modules[\\/]_?element-ui(.*)/ // in order to adapt to cnpm
          // }
        }
      })
      // https://webpack.js.org/configuration/optimization/#optimizationruntimechunk
      config.optimization.runtimeChunk('single')
    })
  }
}
