/*
 * @Author: your name
 * @Date: 2020-11-30 15:36:54
 * @LastEditTime: 2020-11-30 15:37:52
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo\reactDemo\redux\redux-thunk\src\api\index.js
 */
import axios from 'axios'

export const getMock = () => axios.get('http://localhost:1024/react/getMock')