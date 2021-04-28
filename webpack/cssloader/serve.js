/*
 * @Author: your name
 * @Date: 2020-11-28 16:53:58
 * @LastEditTime: 2021-04-22 00:09:04
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \serve\index.js
 */
const express = require('express')
// var cors = require('express-cors')
const app = express()

// 使用静态资源
app.use(express.static('build', { maxAge: 1000 * 3600 }))
// //SQL
// var sql = 'SELECT * FROM user';
// pool.query(sql, function (err, result) {
//     if (err) {
//         console.log('[SELECT ERROR] - ', err.message);
//         return;
//     }

//     console.log('--------------------------SELECT----------------------------');
//     console.log(result);
//     // res.end(JSON.stringify(result))
//     console.log('------------------------------------------------------------\n\n');
// });


app.listen(1024, '127.0.0.1')

console.log(`服务启动成功,127.0.0.1:1024`)