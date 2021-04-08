/*
 * @Author: your name
 * @Date: 2021-03-24 13:48:02
 * @LastEditTime: 2021-04-08 18:31:36
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
  // console.log(nums);
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
 * @description: 堆排序
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
// console.log(arr);


/**
 * @description: 选择排序
 * @param {*} 时间复杂度 o(n²)
 * @return {*}
 */

function selectionSort (arr) {
  for (let i = 0; i < arr.length - 1; i++) {
    let minIndex = i
    for (let j = i; j < arr.length; j++) {
      if (arr[minIndex] > arr[j]) {
        minIndex = j
      }
    }
    if (minIndex !== i) swap(arr, minIndex, i)
  }
  return arr
}

const sele = selectionSort([5, 4, 3, 2, 1])
// console.log(sele);

/**
 * @description: 插入排序 
 * @param {*}
 * @return {*}
 */
function insertionSort (array, compareFn = defaultCompare) {
  for (let i = 1; i < array.length; i++) {
    let j = i
    let temp = array[i]
    while (j > 0 && compareFn(array[i], array[j - 1]) === Compare.BIGGER_THAN) {
      swap(array, j, j - 1)
      j--
    }
  }
  return arr
}

const inse = selectionSort([5, 4, 3, 2, 1])
// console.log(inse);


/**
 * @description:  归并排序
 * @param {*}  时间复杂度 nlogn
 * @return {*}
 */
function mergeSort (arr, compareFn = defaultCompare) {
  if (arr.length > 1) {
    const { length } = arr
    const middle = Math.floor(length / 2)
    const left = mergeSort(arr.slice(0, middle))
    const rifht = mergeSort(arr.slice(middle, length))
    arr = merge(left, rifht)
  }
  return arr
}
function merge (left, right, compareFn = defaultCompare) {
  let i = 0
  let j = 0
  let newArr = []
  while (i < left.length && j < right.length) {
    newArr.push(
      compareFn(left[i], right[j]) === Compare.LESS_THAN ? left[i++] : right[j++]
    )
  }
  return i < left.length ? newArr.concat(left) : newArr.concat(right)
}

const merg = mergeSort([5, 4, 3, 2, 1])
// console.log(merg);

/**
 * @description: 快速排序
 * @param {*} 时间复杂度 o(nlogn)
 * @return {*}
 */
function quickSort (arr, compareFn = defaultCompare) {
  console.log(1);
  return quick(arr, 0, arr.length - 1)
}

function quick (arr, left, right, compareFn = defaultCompare) {
  console.log(2);
  let index
  if (arr.length > 1) {
    console.log(3);
    index = partition(arr, left, right)
    console.log(4);
    if (left < index - 1) {
      quick(arr, left, index - 1)
    }
    if (index < right) { // {6} 
      quick(arr, index, right); // {7} 
    }
  }
  return arr
}

function partition (arr, left, right, compareFn = defaultCompare) {
  console.log(3.1);
  const pivot = arr[Math.floor((left + right) / 2)]
  let i = left
  let j = right
  while (i <= j) {
    console.log(3.2);
    while (compareFn(arr[i], pivot) === Compare.LESS_THAN) {
      console.log(3.3);
      i++
    }
    while (compareFn(arr[j], pivot) === Compare.BIGGER_THAN) {
      console.log(3.4);
      j--
    }
    console.log(3.5);
    if (i <= j) {
      console.log(3.4);
      swap(arr, i, j)
      i++
      j--
    }
  }
  return i
}

const qui = quickSort([5, 4, 3, 2, 1])
console.log('qui', qui);