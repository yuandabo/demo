/*
 * @Author: your name
 * @Date: 2021-03-05 00:25:02
 * @LastEditTime: 2021-03-05 00:29:38
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo2\vue\eleme\phoneweb\src\utils\index.js
 */
export const debounce = (fn, wait) => {
  console.log(fn)
  var timeout = null;
  return function () {
    if (timeout !== null) clearTimeout(timeout);
    timeout = setTimeout(fn, wait);
  }
}
export const throttle = (func, delay) => {
  var timer = null;
  return function () {
    var context = this;
    var args = arguments;
    if (!timer) {
      timer = setTimeout(function () {
        func.apply(context, args);
        timer = null;
      }, delay);
    }
  }
}       