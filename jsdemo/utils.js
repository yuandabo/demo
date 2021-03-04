/*
 * @Author: your name
 * @Date: 2020-10-14 11:41:43
 * @LastEditTime: 2021-03-05 00:24:18
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
/**
 * @description: 时间相减得到天数
 * @param {*}
 * @return {*}
 */
function GetNumberOfDays (date1, date2) {//获得天数
  //date1：开始日期，date2结束日期
  var a1 = Date.parse(new Date(date1));
  var a2 = Date.parse(new Date(date2));
  var day = parseInt((a2 - a1) / (1000 * 60 * 60 * 24));//核心：时间戳相减，然后除以天数
  return day
}

/**
 * @description: 防抖
 * @param {*}
 * @return {*}
 */
function debounce (fn, wait) {
  var timeout = null;
  return function () {
    if (timeout !== null) clearTimeout(timeout);
    timeout = setTimeout(fn, wait);
  }
}