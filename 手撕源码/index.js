/*
 * @Author: your name
 * @Date: 2020-11-10 17:11:23
 * @LastEditTime: 2021-01-20 10:12:20
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
  context[fn] = this  // this 指向调用函数
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

// console.log('clone: ', clone);
// console.log('target: ', target);

/**
 * @description: ES5实现继承
 * 继承extend：父类的方法、属性被子类继承或者重新定义、追加属性和方法
 * 多态
 * 封装
 */

// 第一种方法： 两个构造函数，Child 继承 Parent 。 常用的组合式继承（构造函数继承 + 原型继承）
function Parent (name, age) {
  this.name = name
  this.age = age
  this.color = ['blue', 'red']
}
Parent.prototype.showSelf = function () {
  console.log(`my name is ${this.name} im ${this.age} years old`)
}
function Child (name, age) {
  Parent.call(this, name)  // 通过call调用
  this.age = age
}
let child1 = new Child('xiaohong', 20)
// console.log(child1.__proto__ === Child.prototype); 
//在 new 的过程中  靶对象的__proto__被指向构造函数的prototype

Child.prototype = new Parent().__proto__
// Child构造函数的原型链指向Parent构造函数的prototype 通过prototype实现继承   
// Child.prototype === new Parent().__proto__ === Parent.prototype
// console.log(Child.prototype === new Parent().__proto__);
// console.log(Child.prototype === Parent.prototype);
Child.prototype.sayAge = function () {
  console.log(this.age);
}
let person = new Child('xiaoming', 21)
// console.log(person.color);  //
console.log(person);
// --------------------------------------------------------------------------------
function Parent2 (money) {
  this.money = money
}
Parent2.prototype.fook = function () {
  console.log(`i has ${this.money} 元`)
}
function Son (money) {
  Parent2.call(this, money)
}
Son.prototype = new Parent2().__proto__ // 继承父类prototype上的函数
let son1 = new Son(10000)
// son1.fook()

// 2. 寄生
function inheritPrototype (Parent, Child) {
  Child.prototype = Parent.prototype
}
function Person3 (name) {
  this.name = name
  this.color = ['red']
}
Person3.prototype.showColor = function () {
  console.log(this.color)
}
function Son3 (name) {
  Person3.call(this, name)
}
inheritPrototype(Person3, Son3)
let son3 = new Son3('bob')
son3.color.push('green')
son3.showColor()


// XMLHttpRequest实现ajax请求
// let xhr = new XMLHttpRequest()

// xhr.onreadystatechange = function () {
//   if (xhr.readyState === 4) {
//     if (xhr.status === 200) {
//       console.log('xhr ok!');
//     }
//   }
// }
// xhr.open(
//   'GET',
//   URL,
//   true
// )
// xhr.send(null);

/* 
<form action="" id="form">
<input type="text" name="username">
</form>
<button id="button">查看</button>
<script>
  let formnode = document.querySelector('#form')
  let button = document.querySelector('#button')
  button.addEventListener('click', () => {
    let formdata = new FormData(formnode)
    console.log(formdata.get('username'))
  })
</script> */

/*  FormDataApi https://wangdoc.com/javascript/bom/form.html#checkvalidity */

function formatData (obj) {
  const temp = []
  for (const key in obj) {
    temp.push(`${key}=${encodeURIComponent(obj[key])}`)
  }
  return temp.join('&')
}

/**
 * @description: 模拟AJAX
 * @param {*} params
 * @return {*}
 */
function _ajax (params = {}) {
  const { type, URL, data, success, error } = params
  if (!url) {
    throw 'url is a required param'
  }
  type = (type || 'get').toUpperCase()
  data = data && formatData(data)
  if (!XMLHttpRequest) return
  let xhr = new XMLHttpRequest()
  if (type === 'GET') {
    xhr.open(
      'GET',
      `${URL}?${data}`,
      true
    )
    xhr.setRequestHeader('Content-Type', 'application/json'); s
    xhr.send()
  } else {
    xhr.open(
      'POST',
      URL,
      true
    )
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send(data)
  }
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        success && success.call(undefined, xhr.responseText);
        console.log('xhr ok!');
      } else {
        error && error.call(undefined, xhr.responseText);
      }
    }
  }
}
// 模拟ajax发送promise得get请求
const request = url => {
  return new Promise((resolve, reject) => {
    if (!XMLHttpRequest) return
    const xhr = new XMLHttpRequest()
    xhr.open('GET', url, true)
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        resolve(xhr.response)
      }

      xhr.send()
    }
  })
}

/**
 * @description: 闭包
 */
const scope = 'global scope'
function checkscope () {
  const scope = 'local scope'
  return function () {
    return scope
  }
}
const b = checkscope()
console.log(b());