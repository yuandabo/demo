/*
 * @Author: your name
 * @Date: 2020-12-17 16:46:45
 * @LastEditTime: 2020-12-17 17:09:44
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \demo\uniappdemo\serve\plugins\authenticate.js
 */
var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  User = require('./models/user')

var JwtStrategy = require('passport-jwt').Strategy,
  ExtractJwt = require('passport-jwt').ExtractJwt,
  jwt = require('jsonwebtoken')

var config = {
  secretKey: '12345-67890-9876-54321',
}

passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

exports.getToken = function (user) {
  return jwt.sign(user, config.secretKey, { expiresIn: 3600 }) // 签发token时设置超时时间是3600s
}

var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken() // 从验证头中提取，模型默认是`'bearer'`.
opts.secretOrKey = config.secretKey

exports.jwtPassport = passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
  console.log('JWT payload: ', jwt_payload)
  User.findOne({ _id: jwt_payload._id }, (err, user) => {
    if (err) {
      return done(err, false)
    } else {
      if (user) {
        return done(null, user)
      } else {
        return done(null, false)
      }
    }
  })
}))

// exports.verifyUser = passport.authenticate('jwt', { session: false }) // 使用jwt就不再需要session保存用户数据了。

exports.verifyUser = passport.authenticate('jwt', {
  session: false,
  failureRedirect: '/error/auth' // 在这个路由里统一处理验证不通过的事情
})