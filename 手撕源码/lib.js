/*
 * @Author: your name
 * @Date: 2020-12-02 10:37:09
 * @LastEditTime: 2022-01-11 15:12:54
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \手撕源码\lib.js
 */
/**
 * @description: 写一个方法   要求去掉字符串的所有空格
 * @param {*}   '1 2 3      4    5'
 * @return {*}   '123'
 */
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
// 第一种方法 join
function myTrim(str) {
    return str.split(' ').join('');
}
var ar = myTrim('1 2 3      4    5');
console.log('ar', ar);
// 第二种方法 RegExp
function myTrim2(str) {
    return str.replace(/\s/g, '');
}
var ar2 = myTrim2('1 2 3      4    5');
console.log('ar2', ar2);
/**
 * @description: 用递归算法实现，数组长度为5且元素的随机数在2-32间不重复的值
 * @param {*}
 * @return {*}
 */
function addNum(arr, length, min, max) {
    var randomNum = Math.max(min, Math.ceil(Math.random() * max));
    if (!arr.includes(randomNum))
        arr.push(randomNum);
    return arr.length === length ? arr : addNum(arr, length, min, max);
}
console.log('arr', addNum([], 5, 2, 32));
/**
 * @description: 去除字符串中最后一个指定的字符
 * @param {*}
 * @return {*}
 */
function delLastCode(str, code) {
    var option = str.lastIndexOf(code);
    if (option !== -1) {
        var arr = str.split('');
        arr.splice(option, 1);
        return arr.join('');
    }
    return '不存在该字符';
}
var newStr = delLastCode('abcdefg', 'f');
console.log(newStr);
/**
 * @description: 写一个方法把下划线命名转成大驼峰命名
 * @param {*} `project_manage`
 * @return {*}
 */
function downLineTransToBigCamel(souceString) {
    var arr = souceString.split('_');
    arr = arr.map(function (v) {
        var itemArr = v.split('');
        itemArr[0] = itemArr[0].toUpperCase();
        return itemArr.join('');
    });
    return arr.join('');
}
var result = downLineTransToBigCamel("project_manage");
console.log(result);
/**
 * @description: 写一个去除制表符和换行符的方法
 * @param {*} `大家好  阿斯蒂芬阿斯顿\n发生的发生`
 * @return {*}
 */
function specialFilter(str) {
    return str.replace(/\s+/g, '');
}
console.log(specialFilter('大家好  阿斯蒂芬阿斯顿\n发生的发生'));
/**
 * @description: 写一个获取当前url查询字符串中的参数的方法
 * @param {*}
 * @return {*}
 */
function getLocationParams(url) {
    var arr = new URL(url).search.substring(1, url.length).split('&');
    var obj = {};
    arr.forEach(function (v) {
        var _a = v.split('='), key = _a[0], value = _a[1];
        obj[key] = decodeURIComponent(value);
    });
    return obj;
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
        arr.forEach(function (v) {
            if (v instanceof Array) {
                flatArray(v, set);
                return;
            }
            set.add(v);
        });
    }
    return __spreadArrays(set);
}
// let set = new Set([])
// console.log(flatArray([1, 2, [3, 4, 3]], set));
/**
 * @description:  写一个方法验证是否为中文
 * @param {*}  '我是谁'
 * @return {*} boolean
 */
function validIsChinese(str) {
    return /^[\u4e00-\u9fa5]+$/g.test(str);
} // 纯中文
console.log(validIsChinese('我是谁'));
function validIsChinese2(str) {
    return /^\W+$/g.test(str);
} // 可能包含标点符号
console.log(validIsChinese2('我是谁，。'));

/** 
 * @description generator 函数进行循环fetch
*/
async function asyncFecth(url, sum, paramsList, num = 0) {
    try {
        console.log(num);
        const result = await fetch(url)
        num+=1
        return num === sum ? result : asyncFecth(url, sum, paramsList, num);
    } catch (error) {
        return error
    }
}
asyncFecth('http://127.0.0.1:1024/admin/get/all', 5, [,1,2,3,4,5,6,7], 0).then((res) => {
    console.log(res)
});

function* generatorFecth (arr) {
    arr.forEach(()=>{
        yield fetch('http://127.0.0.1:1024/admin/get/all')
    })
}

var gefn = generatorFecth([0,1,2,3,4,5,6,7])



    console.log('1');

    setTimeout(function() {
        console.log('2');
        process.nextTick(function() {
            console.log('3');
        })
        new Promise(function(resolve) {
            console.log('4');
            resolve();
        }).then(function() {
            console.log('5')
        })
    })
    process.nextTick(function() {
        console.log('6');
    })
    new Promise(function(resolve) {
        console.log('7');
        resolve();
    }).then(function() {
        console.log('8')
    })

    setTimeout(function() {
        console.log('9');
        process.nextTick(function() {
            console.log('10');
        })
        new Promise(function(resolve) {
            console.log('11');
            resolve();
        }).then(function() {
            console.log('12')
        })
    })



    const treedata = [
        {
          id: 1,
          label: '1',
          children: [
            {
              id: 2,
              label: '2',
              children: [
                { id: 4, label: '4'},
                { id: 5, label: '5' }
              ]
            },
            {
              id: 3,
              label: '3',
              children: [
                { id: 6, label: '6' },
                { id: 7, label: '7' }
              ]
            }
          ]
        },
        {
          id: 11,
          label: '11',
          children: [
            {
              id: 21,
              label: '21',
              children: [
                { id: 41, label: '41' },
                { id: 51, label: '51' }
              ]
            },
            {
              id: 31,
              label: '31',
              children: [
                { id: 61, label: '61' },
                { id: 71, label: '71' }
              ]
            }
          ]
        }
      ]
     //把上面数据处理为
     
     [
        {
        ids:[1,2,4],
        labels:['1','2','4']
        },
        {
        ids:[1,2,5],
        labels:['1','2','5']
        },
        {
        ids:[1,3,6],
        labels:['1','3','6']
        },
        {
        ids:[1,3,7],
        labels:['1','3','7']
        }
     ]


    const treedata = [
    {
        id: 1,
        label: '1',
        children: [
        {
            id: 2,
            label: '2',
            children: [
            { id: 4, label: '4'},
            { id: 5, label: '5' }
            ]
        },
        {
            id: 3,
            label: '3',
            children: [
            { id: 6, label: '6' },
            { id: 7, label: '7' }
            ]
        }
        ]
    },
    {
        id: 11,
        label: '11',
        children: [
        {
            id: 21,
            label: '21',
            children: [
            { id: 41, label: '41' },
            { id: 51, label: '51' }
            ]
        },
        {
            id: 31,
            label: '31',
            children: [
            { id: 61, label: '61' },
            { id: 71, label: '71' }
            ]
        }
        ]
    }
    ]
    
    function treeDataTransferToSelectData (treedata, newArr,index) {
        newArrItem = newArr[index]
        treedata.forEach(a => {
            newArrItem.ids.push(a.id)
            newArrItem.labels.push(a.label)
            if (!a.children) {
                return
            }
            return treeDataTransferToSelectData (a.children, newArr, index)
        })
    }

    let newArr = []
    let i = 0
    treedata.forEach((a) => {
        newArr.push({
            ids: [a.id],
            labels: [a.label]
        })
        if (a.children) treeDataTransferToSelectData(a.children, newArr,i);
        i++;
    })

    console.log(newArr);