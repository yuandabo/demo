/*
 * @Author: your name
 * @Date: 2021-03-24 13:48:02
 * @LastEditTime: 2021-04-07 00:13:10
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
// console.log(pupleSort([5, 4, 3, 2, 1]))

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
  // console.log(nums);
  return arr
}
// console.log(pupleSort2([5, 4, 3, 2, 1]))




/**
 * @description: 堆查找
 * @param {*}
 * @return {*}
 */

const swap = (array, a, b) => [array[a], array[b]] = [array[b], array[a]];

const Compare = {
  LESS_THAN: -1,
  BIGGER_THAN: 1
};

function defaultCompare (a, b) {
  if (a === b) { // {1} 
    return 0;
  }
  return a < b ? Compare.LESS_THAN : Compare.BIGGER_THAN; // {2} 
}

function heapSort (arr) {
  let n = arr.length
  buildHeap(arr)
  for (i = n - 1; i >= 0; i--) {
    swap(arr, i, 0)
    heapify(arr, i, 0)
  }
  return arr
}

function heapify (arr, n, i) {
  if (i >= n) return
  const left = 2 * i + 1 // {1} 
  const right = 2 * i + 2 // {2}
  // const parent = i
  let max = i
  if (left < n && arr[left] > arr[max]) {
    max = left
  }
  if (right < n && arr[right] > arr[max]) {
    max = right
  }
  if (max != i) {
    swap(arr, max, i)
    heapify(arr, n, max)
  }
}

function buildHeap (arr) {
  let n = arr.length
  let lastNode = n - 1
  const parent = (lastNode - 1) / 2
  let i
  for (i = parent; i >= 0; i--) {
    heapify(arr, n, i)
  }
}


const arr = heapSort([4, 10, 3, 5, 1, 2])
console.log(arr);