/*
 * @Author: your name
 * @Date: 2020-12-02 10:37:09
 * @LastEditTime: 2020-12-16 09:34:38
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \手撕源码\lib.js
 */
/**
 * @description: 写一个方法   要求去掉字符串的所有空格
 * @param {*}   '1 2 3      4    5'  
 * @return {*}   '123'
 */

// 第一种方法 join
function myTrim(str) {
  return str.split(' ').join('')
}
const ar = myTrim('1 2 3      4    5')
console.log('ar', ar)

// 第二种方法 RegExp
function myTrim2(str) {
  return str.replace(/\s/g, '')
}
const ar2 = myTrim2('1 2 3      4    5')
console.log('ar2', ar2)

/**
 * @description: 用递归算法实现，数组长度为5且元素的随机数在2-32间不重复的值
 * @param {*}
 * @return {*}
 */

function addNum(arr, length, min, max) {
  const randomNum = Math.max(min, Math.ceil(Math.random() * max))
  if (!arr.includes(randomNum)) arr.push(randomNum)
  return arr.length === length ? arr : addNum(arr, length, min, max)
}
console.log('arr', addNum([], 5, 2, 32));

/**
 * @description: 去除字符串中最后一个指定的字符
 * @param {*}
 * @return {*}
 */
function delLastCode(str: string, code: string): string {
  const option = str.lastIndexOf(code)
  if (option !== -1) {
    const arr = str.split('')
    arr.splice(option, 1)
    return arr.join('')
  }
  return '不存在该字符'
}
const newStr: string = delLastCode('abcdefg', 'f')
console.log(newStr);


/**
 * @description: 写一个方法把下划线命名转成大驼峰命名
 * @param {*} `project_manage`
 * @return {*}
 */
function downLineTransToBigCamel(souceString: string): string {
  let arr = souceString.split('_')
  arr = arr.map(v => {
    const itemArr: Array<string> = v.split('')
    itemArr[0] = itemArr[0].toUpperCase()
    return itemArr.join('')
  })
  return arr.join('')
}
const result: string = downLineTransToBigCamel(`project_manage`)
console.log(result)


/**
 * @description: 写一个去除制表符和换行符的方法
 * @param {*} `大家好  阿斯蒂芬阿斯顿\n发生的发生`
 * @return {*}
 */
function specialFilter(str: string): string {
  return str.replace(/\s+/g, '')
}
console.log(specialFilter('大家好  阿斯蒂芬阿斯顿\n发生的发生'))
/**
 * @description: 写一个获取当前url查询字符串中的参数的方法
 * @param {*} 
 * @return {*}
 */
function getLocationParams(url: string): object {
  const arr: Array<string> = new URL(url).search.substring(1, url.length).split('&')
  const obj = {}
  arr.forEach(v => {
    const [key, value] = v.split('=')
    obj[key] = decodeURIComponent(value)
  })
  return obj
}
/**
 * @description:  写一个数组去重的方法（支持多维数组）
 * @param {*} [1, 2, [3, 4]]
 * @return {*}
 */
// function flatArray(arr): Array<any> {
//   return [...new Set(arr.flat(Infinity))]

// }
// console.log(flatArray([1, 2, [3, 4, 3]]));

function flatArray(arr, set) {
  if (arr instanceof Array) {
    arr.forEach(v => {
      if (v instanceof Array) {
        flatArray(v, set)
        return
      }
      set.add(v)
    })
  }
  return [...set]
}
// let set = new Set([])
// console.log(flatArray([1, 2, [3, 4, 3]], set));
/**
 * @description:  写一个方法验证是否为中文
 * @param {*}  '我是谁'
 * @return {*} boolean
 */

function validIsChinese(str: string): boolean {
  return /^[\u4e00-\u9fa5]+$/g.test(str)
}  // 纯中文
console.log(validIsChinese('我是谁'));
function validIsChinese2(str: string): boolean {
  return /^\W+$/g.test(str)
}  // 可能包含标点符号
console.log(validIsChinese2('我是谁，。'));