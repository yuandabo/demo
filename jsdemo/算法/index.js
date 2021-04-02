/*
 * @Author: your name
 * @Date: 2021-03-24 13:48:02
 * @LastEditTime: 2021-03-24 23:47:35
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo\jsdemo\算法\index.js
 */

/**
 * @description:  二分查找
 * @param {*}  
 * @return {*}  未找到：-1  找到：index
 */
function binarySearch (target, array) {
  var left = 0
  var right = array.length - 1
  var mid
  while (left <= right) {
    mid = array[Math.floor(right - ((right - left) / 2))]
    if (target === array[mid]) {
      return mid
    } else if (target < array[mid]) {
      right = mid - 1
    } else {
      left = mid + 1
    }
  }
  return -1
}
// console.log(binarySearch(4, [0, 1, 2, 3]))

/**
 * @description: 冒泡排序
 * @param {*}
 * @return {*}
 */
function pupleSort (arr) {
  let nums = 0
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i; j++) {
      nums++
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
      }
    }
  }
  console.log(nums);
  return arr
}
console.log(pupleSort([5, 4, 3, 2, 1]))

function pupleSort2 (arr) {
  let nums = 0
  for (let i = arr.length; i > 0; i--) {
    for (let j = 0; j < i; j++) {
      nums++
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
      }
    }
  }
  console.log(nums);
  return arr
}
// console.log(pupleSort2([5, 4, 3, 2, 1]))