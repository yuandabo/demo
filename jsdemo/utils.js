/*
 * @Author: your name
 * @Date: 2020-10-14 11:41:43
 * @LastEditTime: 2020-12-21 11:47:26
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo\jsdemo\utils.js
 */
/**
 * @description: js类型检测
 * @param {type} 
 * @return {type} 
 */
function classOf (obj) {
  return Object.prototype.toString.call(obj).slice(8, -1)
}
/**
 * @description: js洗牌算法
 * @param {type}
 * @return {type}
 */
Array.prototype.shuffle = function () {
  var input = this
  for (var i = input.length - 1; i >= 0; i--) {
    var randomIndex = Math.floor(Math.random() * (i + 1))
    var itemAtIndex = input[randomIndex]
    input[randomIndex] = input[i]
    input[i] = itemAtIndex
  }
  return input
}
var tempArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
tempArray.shuffle()
console.log(tempArray);


let ua
if (navigator) {
  ua = navigator.userAgent
}
const obj = {
  // 移动端
  isMobile: ("ontouchstart" in window || navigator.msMaxTouchPoints) ? true : false,
  // 微信
  isWechat: /micromessenger/gi.test(ua),
  // qq
  isQQ: /qq/gi.test(ua),
  // VV音乐
  isvvmusic: /vvmusic/gi.test(ua),
  // 安卓
  isAndroid: /android/gi.test(ua),
  // iOS
  isIOS: /iphone|ipad|ipod|itouch/gi.test(ua), // IOS
}

console.log(obj.isMobile);