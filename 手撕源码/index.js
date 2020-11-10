/*
 * @Author: your name
 * @Date: 2020-11-10 17:11:23
 * @LastEditTime: 2020-11-10 17:26:58
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \手撕源码\index.js
 */
/**
 * @description:  Function.prototype.bind(obj) 将函数绑定至某个对象
 * @param {*}
 * @return {*} new Function
 */
funciton bind(f, obj){
  if (f.bind) return f.bind(obj)
  else return function () {
    return f.apply(obj, arguments)
  }
}