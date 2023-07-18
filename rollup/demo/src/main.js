/*
 * @Author: yuandabo 540496776@qq.com
 * @Date: 2023-06-28 16:58:03
 * @LastEditors: yuandabo 540496776@qq.com
 * @LastEditTime: 2023-06-28 17:02:55
 * @FilePath: \demo\rollup\demo\main.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import {a} from './modules/index'

a()

new Promise((resolve) => {
    resolve(1)
}).then((s)=>{
    console.log(`output->s`,s)
})