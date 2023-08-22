// 這段重複的部份很多，需要之後來優化@@
const jwt = require('jsonwebtoken')

const passport = require('../config/passport')

const errors = require('../helpers/errors-helpers')

// adminLocalAuth 與 userLocalAuth是提供給第一次login使用的
const adminLocalAuth = (req, res, next) => {
  const middleware = passport.authenticate('local', { session: false }, function callback (error, user) {
    if (error || !user) return res.redirect('/admin/login')

    if (user.role !== 'admin') {
      return next(new errors.LocalStrategyError('只有管理員可以訪問此區域。'))
    }

    req.user = user
    next()
  })
  middleware(req, res, next)
}
const userLocalAuth = (req, res, next) => {
  const middleware = passport.authenticate('local', { session: false }, function callback (error, user) {
    if (error || !user) return res.redirect('/login')
    if (user.role === 'admin') {
      return next(new errors.LocalStrategyError('管理員不能訪問此區域。'))
    }
    req.user = user
    next()
  })
  middleware(req, res, next)
}

const adminJWTAuth = (req, res, next) => {
  const middleware = passport.authenticate('jwt', { session: false }, function callback (error, user) { // 這個function會被傳入passport的jwt strategy
    if (error || !user) return res.redirect('/admin/login')
    if (user.role !== 'admin') {
      // 這邊不確定可不可以這樣寫
      return next(new errors.JWTStrategyError('只有管理員可以訪問此區域。'))
    }
    req.user = user

    next()
  })
  middleware(req, res, next)
}

const userJWTAuth = (req, res, next) => {
  const middleware = passport.authenticate('jwt', { session: false }, function callback (error, user) { // 這個function會被傳入passport的jwt strategy
    if (error || !user) return res.redirect('/admin/login')
    if (user.role === 'admin') {
      // 這邊不確定可不可以這樣寫
      return next(new errors.LocalStrategyError('管理員不能訪問此區域。'))
    }
    req.user = user
    next()
  })
  middleware(req, res, next)
}

// login成功後由此簽發
const JWT_DURATION_HOURS = 24
const sendToken = (req, res, next) => {
  try {
    const userData = req.user.toJSON() // 關閉session後直接從localstrategy得到user，是直接從sequelize中撈出來的
    delete userData.password
    const token = jwt.sign(userData, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: `${JWT_DURATION_HOURS}h` }) // 簽發jwt
    res.cookie('jwtToken', token, {
      httpOnly: true,
      secure: false, // 如果使用 HTTPS，請取消註釋此行
      maxAge: JWT_DURATION_HOURS * 60 * 60 * 1000 // 設置 cookie 的有效期，例如24小時
    })
    next()
  } catch (error) {
    return next(error)
  }
}

const isAuthenticated = (req, res, next) => {
  // 因為JWT沒有state, 所以進入signin業面前要先檢查有沒有合格的JWT Token, 如果有就把req.isAuthenticated設成true
  const middleware = passport.authenticate('jwt', { session: false }, function callback (error, user) { // 這個function會被傳入passport的jwt strategy
    if (error || !user) return next()
    req.isAuthenticated = () => true
    next()
  })
  middleware(req, res, next)
}
module.exports = { adminLocalAuth, userLocalAuth, sendToken, adminJWTAuth, userJWTAuth, isAuthenticated }