/*
 * @Author: your name
 * @Date: 2021-04-19 16:27:25
 * @LastEditTime: 2021-04-22 17:24:36
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo\webpack\cssloader\src\js\fun.js
 */
// function add (a, b) {
//   return a + b
// }
// console.log(add(1, 2));
// console.log(1234);

// new Promise((resolve, reject) => {
//   setTimeout(() => { console.log(123123); }, 200)
//   resolve()
// })

export const sum = (arr) => {
  return arr.reduce((a, b) => {
    return a + b
  })
}

export function sum2 (arr) {
  return arr
}

// export default {
//   sum, sum2
// }