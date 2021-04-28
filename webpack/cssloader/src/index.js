/*
 * @Author: your name
 * @Date: 2021-04-18 14:28:49
 * @LastEditTime: 2021-04-22 17:43:31
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo\webpack\cssloader\index.js
 */
import './index.css'
import './index.scss'
import './other/ali.css'
import { sum } from './js/fun'
import './js/jq'
import jquery from 'jquery'
console.log(jquery);
console.log(sum([1, 2]));

document.getElementById('btn').onclick = function () {
  // prefreth 
  import(/* webpackChunkName:'/jq',webpackPrefetch:true */'./js/jq').then(() => {

  })
}