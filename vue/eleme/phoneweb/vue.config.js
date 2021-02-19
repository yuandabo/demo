const CompressionWebpackPlugin = require('compression-webpack-plugin')
const isProd = process.env.NODE_ENV === 'production'
module.export = {
  publicPath: './',
  // 是否生成soucemap
  productionSourceMap: false,
  // script,style是否加上用户凭证
  crossorigin: undefined,
  // 开发环境的配置
  devServer: {
    proxy: 'http://127.0.0.1:3001'
  },
  configureWebpack: config => {
    if (isProd) {
      // 配置webpack 压缩
      config.plugins.push(
        new CompressionWebpackPlugin({
          test: /\.js$|\.html$|\.css$/,
          // 超过4kb压缩
          threshold: 4096
        })
      )
    }
  }
}