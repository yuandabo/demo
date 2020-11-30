/*
 * @Author: your name
 * @Date: 2020-11-28 17:01:19
 * @LastEditTime: 2020-11-28 17:31:19
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \serve\routes\react-demo\index.js
 */
module.exports = app => {
  app.get('/react/getMock', async (req, res) => {
    const userData = require('../../plugins/handle')
    userData.getmock(req, res)
  })
}