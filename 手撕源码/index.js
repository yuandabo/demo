/*
 * @Author: your name
 * @Date: 2020-11-10 17:11:23
 * @LastEditTime: 2020-11-11 14:40:18
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \手撕源码\index.js
 */
/**
 * @description:  Function.prototype.bind(obj) 将函数绑定至某个对象
 * @param {*}  
 * @return {*} new Function
 */
function mybind (obj, f) {  // 完整版本的bind方法
  const self = this
  let bindArgs = [].slice.call(arguments, 1);
  function f () { }
  let fBounce = function () {
    let fnArgs = [].slice.call(arguments);
    return self.apply(
      this instanceof fBounce ? this : context
      , bindArgs.concat(fnArgs))
  }
  f.prototype = this.prototype
  fBounce.prototype = new f()
  return fBounce
}
/**
 * @description: call   改变调用函数的当前上下文
 * @param {*}
 * @return {*}
 */
Function.prototype.mycall = function (context, ...args) { // ES6版本
  context = context || window
  // const args = Array.from(arguments).slice(1)
  const fn = Symbol('_fn')
  context[fn] = this
  let res = context[fn](...args)
  delete context[fn]
  return res
}
/**
 * @description: 改变调用函数的当前上下文
 * @param {*}
 * @return {*}
 */
Function.prototype.myapply = function (context, args) {
  context = context || window
  const fn = Symbol('_fn')
  context[fn] = this
  const res = context[fn](...args)
  delete context[fn]
  return res
}
/**
 * @description: 
 * @param {*}
 * @return {*}
 */
const arr = [1, 2, 3, 4, 5]
const context = {}
const max = Math.max.bind(context, ...arr)()
// const max = Math.max.myapply(context, arr)
console.log(max)

/**
 * @description: new 
 * @param {*}
 * @return {*}
 */
function mynew (constructor, ...args) {
  if (typeof constructor !== 'function') return
  const self = this
  const target = {}
  target.__proto__ = constructor.prototype
  let result = constructor.apply(target, args)
  if (result instanceof Object) {
    return result;
  }
  return target;
}

// function Person (name) {
//   this.name = name
// }
// const xiaolv = mynew(Person, '小绿')
// const xiaohuang = new Person('小黄')
// console.log(xiaolv.__proto__ === xiaohuang.__proto__)
