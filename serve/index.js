/*
 * @Author: your name
 * @Date: 2020-11-28 16:53:58
 * @LastEditTime: 2020-11-30 16:09:03
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \serve\index.js
 */
const express = require('express')
var cors = require('express-cors')
const app = express()

const bodyParser = require('body-parser')
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
  extended: false
}))
// parse application/json
app.use(bodyParser.json())
app.use(cors({
  allowedOrigins: [
    'http://localhost:8080', 'http://localhost:8081', 'http://localhost:3000'
  ]
}))
require('./routes/admin')(app)
require('./routes/user')(app)
require('./routes/react-demo')(app)

// 使用静态资源
app.use('/uploads', express.static(__dirname + '/uploads'))
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

console.log('服务启动成功')