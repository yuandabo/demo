module.exports = {
  resolve: {// 减少后缀
    extensions: ['.js', '.jsx', '.json'],
    // modules: [ // 指定以下目录寻找第三方模块，避免webpack往父级目录递归搜索
    //   resolve('app'),
    //   resolve('node_modules'),
    // ],
    alias: { // 减少使用别名提高编译速速
      // '@app': path.join(__dirname, '../app'),
      // '@actions': path.join(__dirname, '../app/redux/actions'),
      // '@reducers': path.join(__dirname, '../app/redux/reducers'),
      // '@apis': path.join(__dirname, '../app/apis'),
      // '@components': path.join(__dirname, '../app/components'),
      // '@configs': path.join(__dirname, '../app/configs'),
      // '@config': path.join(__dirname, '../app/configs/config.js'),
      // '@ajax': path.join(__dirname, '../app/configs/ajax.js'),
      // '@reg': path.join(__dirname, '../app/configs/regular.config.js'),
      // '@images': path.join(__dirname, '../app/images'),
      // '@middleware': path.join(__dirname, '../app/middleware'),
      '@pages': path.join(__dirname, '../pages')
      // '@styles': path.join(__dirname, '../app/styles'),
      // '@tableList': path.join(__dirname, '../app/components/tableList/tableList.js'),
      // 'react-dom': devMode ? '@hot-loader/react-dom' : 'react-dom', // react-hot-loader需要
    },
  },
}