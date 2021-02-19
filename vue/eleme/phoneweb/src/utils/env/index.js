/*
 * @Author: your name
 * @Date: 2021-02-19 17:11:35
 * @LastEditTime: 2021-02-19 17:26:24
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo\vue\eleme\phoneweb\src\utils\env\index.js 
 */
/**
 * @description: DEV 开发  PRO 生产
 */
console.log('NODE_ENV', process.env.NODE_ENV)
export const mode = process.env.NODE_ENV === 'development'