/*
 * @Author: your name
 * @Date: 2020-11-28 16:53:58
 * @LastEditTime: 2020-11-28 17:32:17
 * @LastEditors: your name
 * @Description: In User Settings Edit
 * @FilePath: \serve\plugins\db.js
 */
module.exports = pool => {
  var mysql = require('mysql');

  // var connection = mysql.createConnection({
  //     host: 'localhost',
  //     user: 'admin',
  //     password: '123456',
  //     database: 'eleme'
  // });
  // connection.connect();

  return mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'root'
  });
}