/*
 * @Author: your name
 * @Date: 2021-04-18 14:29:02
 * @LastEditTime: 2021-04-22 18:48:59
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo\webpack\cssloader\webpack.config.js
 */
const { resolve, join } = require('path');
const htmlWebpackPlugin = require('html-webpack-plugin');
const miniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const webpack = require('webpack');
const AddAssetHtmlWebpackPlugin = require('add-asset-html-webpack-plugin');

const cssloader = [
  { loader: miniCssExtractPlugin.loader, options: { publicPath: '../', } }, // 将css单独打包成一个css文件并通过Link引入html文件
  'css-loader',
  {
    loader: "postcss-loader",   // 自动生成css兼容代码配合 package.json 中的 browserslist 使用
    options: {
      // casheDirctory: true,
      postcssOptions: {
        plugins: [
          [
            "postcss-preset-env",
            {
              // Options
            },
          ],
        ],
      },
    },
  }
]
module.exports = {
  entry: './src/index.js',
  // entry: ['./src/index.js', './src/index.html'],
  output: {
    path: resolve(__dirname, 'build'),
    filename: 'js/[name].[contenthash:10].js'   // contenthash 解决缓存问题 ； hash与thunkhash 不能解决  hash是webpack每次打包生成的,thunkhash是一个入口生成的，contenthash是单独文件生成的
  },
  module: {
    rules: [
      // {
      //   test: /\.css$/,
      //   use: [
      //     'style-loader', // 将css文件打包入js文件用style的方式引入
      //     'css-loader'
      //   ]
      // },

      // 使用oneOf优化打包速度
      {
        // 里面的文件只会被一个Loader处理
        oneOf: [
          // 解析css文件
          {
            test: /\.css$/,
            use: [...cssloader]
          },
          // 解析sass文件
          {
            test: /\.scss$/,
            use: [
              ...cssloader,
              'sass-loader'
            ]
            // options: {
            //   casheDirctory: true
            // }
          },
          // 解析图片文件
          // 无法处理html <img>图片
          {
            test: /\.(gif|jpg|png)$/,
            loader: 'url-loader',
            options: {
              limit: 11 * 1024,
              esModule: false,
              name: '[name].[hash:10].[ext]',
              outputPath: 'imgs'
            }
          },
          // html中图片的问题
          {
            test: /\.html$/,
            loader: 'html-loader'
          },
          // 其他文件打包
          {
            exclude: /\.(html|css|js|scss|gif|jpg|png)$/,
            loader: 'file-loader',
          },
          //  js兼容性问题
          {
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            use: [
              {
                loader: 'thread-loader',
                options: { Workers: 2 }
              },
              {
                loader: 'babel-loader',
                options: {
                  // name: '[name].[hash:10].[ext]',
                  cacheDirectory: true,
                  presets: [[
                    '@babel/preset-env',
                    {
                      useBuiltIns: 'usage',
                      //
                      corejs: {
                        version: 3
                      },
                      targets: {
                        chrome: '60',
                        firefox: '60',
                        ie: '9',
                        safari: '10',
                        edge: '17'
                      }
                    }
                  ]
                  ]
                }
              }
            ],

          }
        ]
      }
    ],
  },
  plugins: [
    new htmlWebpackPlugin({
      template: './src/index.html',
      minify: {
        collapseWhitespace: true,
        // keepClosingSlash: true,
        removeComments: true,
      }
    }),
    new miniCssExtractPlugin({
      filename: '/css/main.[contenthash:10].css'
    }),
    // new ESLintPlugin({
    //   extensions: 'js'
    // })
    // 告诉webpack 哪些文件不用打包
    new webpack.DllReferencePlugin({
      manifest: resolve(__dirname, 'dll/manifest.json')
    }),
    new AddAssetHtmlWebpackPlugin({
      filepath: resolve(__dirname, 'dll/jQuery.js')
    })
  ],
  optimization: {
    // usedExports: true,
    minimize: true,
    minimizer: [
      // For webpack@5 you can use the `...` syntax to extend existing minimizers (i.e. `terser-webpack-plugin`), uncomment the next line
      // `...`,
      new CssMinimizerPlugin(),
    ],
    // 让文件单独打包 code split
    splitChunks: {
      chunks: 'all'
    }
  },
  // mode: 'development',
  mode: 'production',
  devServer: {
    contentBase: join(__dirname, 'build'),
    compress: true,
    port: 1024,
    open: true,
    // 开启hot-module-replacement
    hot: true
  },
  devtool: 'source-map',
  // 拒绝打包  配合cdn使用
  // externals: {
  //   jquery: 'jQuery'
  // }
}