/*
 * @Author: your name
 * @Date: 2020-11-10 17:11:23
 * @LastEditTime: 2020-11-12 10:59:02
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
// const arr = [1, 2, 3, 4, 5]
// const context = {}
// const max = Math.max.bind(context, ...arr)()
// // const max = Math.max.myapply(context, arr)
// console.log(max)

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
  // 执行构造函数并得到返回值，若为对象则返回该值，否则返回生成的target
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

/**
 * @description:  instanceof
 * @param {*}
 * @return {*}
 */
function myinstaceof (left, right) {
  let prototype = right.prototype
  left = left.__proto__
  while (true) {
    if (left === null || left === undefined) return false
    if (left === prototype) return true
    left = left.__proto__
  }
}

// function Person (name) {
//   this.name = name
// }
// const xiaolv = mynew(Person, '小绿')
// console.log(myinstaceof(xiaolv, {}))


/**
 * @description: 深拷贝
 * @param {*}
 * @return {*}
 */
function deepClone (value) {
  if (value === null || typeof value !== 'object') {
    return value
  }
  if (value instanceof Date) {
    return new Data().setTime(value.getTime())
  }
  if (value instanceof Array) {
    return value.map(v => deepClone(v))
  }
  if (value instanceof Object) {
    let copy = {}
    const symbols = Object.getOwnPropertySymbols(value) // return Array
    if (symbols.length) {
      symbols.forEach(key => {
        copy[key] = deepClone(value[key])
      })
    }
    for (const key in value) {
      if (value.hasOwnProperty(key)) {
        copy[key] = deepClone(value[key]);
      }
    }
    return copy
  }
}

const target = {
  field1: 1,
  field2: undefined,
  field3: {
    child: {
      a: 1
    }
  },
  field4: [2, 4, 8],
  empty: null,
  fn: params => {
    console.log(params);
  },
  set: new Set([1, 2]),
  symbol: Symbol('symbol'),
  arr: [{ b: 1 }, Symbol('arr')]
};

target[Symbol('attr')] = { a: 1 };

const clone = deepClone(target);

console.log('clone: ', clone);
console.log('target: ', target);