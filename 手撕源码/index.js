/*
 * @Author: your name
 * @Date: 2020-11-10 17:11:23
 * @LastEditTime: 2020-11-10 17:42:14
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \手撕源码\index.js
 */
/**
 * @description:  Function.prototype.bind(obj) 将函数绑定至某个对象
 * @param {*}  
 * @return {*} new Function
 */
funciton bind(f, obj){   // 简单版本
  if (f.bind) return f.bind(obj)
  else return function () {
    return f.apply(obj, arguments)
  }
}
function bind (obj, f) {  // es3版本的bind方法
  var agrs1 = arguments, self = this
  return function () {
    var agrs2 = arguments, args = [], i = 0
    for (i = 1; i < agrs1.length; i++) args.push(args[i])
    for (i = 0; i < agrs2.length; i++) args.push(args[i])
    return f.apply(obj, args)
  }
}
}