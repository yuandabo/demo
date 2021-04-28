/*
 * @Author: your name
 * @Date: 2021-04-22 18:05:25
 * @LastEditTime: 2021-04-22 18:16:37
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo\webpack\cssloader\webpack.dll.js
 */

const webpack = require('webpack')



const { resolve } = require('path')

module.exports = {
  entry: {
    jQuery: ["jQuery"]
  },
  output: {
    filename: '[name].js',
    path: resolve(__dirname, 'dll'),
    library: '[name]_[hash]'
  },
  plugins: [
    new webpack.DllPlugin({
      name: '[name]_[hash]',
      path: resolve(__dirname, 'dll/manifest.json')
    })
  ],
  mode: 'production'
}