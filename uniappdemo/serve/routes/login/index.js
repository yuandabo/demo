/*
 * @Author: your name
 * @Date: 2020-12-17 16:55:02
 * @LastEditTime: 2020-12-17 17:09:12
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo\uniappdemo\serve\routes\login\login.js
 */

module.exports = app => {
  var authenticate = require('../../plugins/authenticate')
  app.post('/login', passport.authenticate('local'), (req, res) => { // 登录时还是使用passport-local
    var token = authenticate.getToken({ _id: req.user._id }) // 得到签发后的jwt
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.json({ success: true, token: token, status: 'You are successful logged in!' })
  })
}