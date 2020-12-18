/*
 * @Author: your name
 * @Date: 2020-12-17 16:59:54
 * @LastEditTime: 2020-12-17 17:10:08
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo\uniappdemo\serve\routes\error\error.js
 */

module.exports = app => {
  var config = {
    secretKey: '12345-67890-9876-54321',
  }
  app.get('/error/auth', (req, res, next) => {
    let header = req.headers
    let rawToken = header.authorization
    if (!rawToken.split(' ').length) {
      res.json({ // 统一的数据结构方便前端使用
        code: 403,
        data: {},
        message: 'error for get token'
      })
    } else {
      let token = rawToken.split(' ')[1]
      jwt.verify(token, config.secretKey, err => { // 这里用到jsonwebtoken/config。注意引用
        switch (err.name) {
          case 'TokenExpiredError':
          case 'NotBeforeError':
            let payload = jwt.decode(token)
            token = authenticate.getToken({ _id: payload._id })
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.json({ success: true, token: token, status: '已经刷新token' })
            break
          case 'JsonWebTokenError':
          default:
            res.statusCode = 401
            res.json({
              code: 401,
              data: {
                error: err
              },
              message: 'token错误'
            })
            break
        }
      })
    }
  })
}
