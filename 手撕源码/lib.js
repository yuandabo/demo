/*
 * @Author: your name
 * @Date: 2020-12-02 10:37:09
 * @LastEditTime: 2020-12-03 14:34:02
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
