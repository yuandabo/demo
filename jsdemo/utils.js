/*
 * @Author: your name
 * @Date: 2020-10-14 11:41:43
 * @LastEditTime: 2020-10-14 13:50:22
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo\jsdemo\utils.js
 */
/**
 * @description: js类型检测
 * @param {type} 
 * @return {type} 
 */
function classOf (obj) {
  return Object.prototype.toString.call(obj).slice(8, -1)
}