const express = require('express')
const router = express.Router()

const { adminLocalAuth, adminJWTAuth, sendToken, isAuthenticated } = require('../../../middlewares/auth')
const userController = require('../../../controllers/pages/user-controller')
const adminController = require('../../../controllers/pages/admin-controller')

router.get('/tweets', isAuthenticated, adminController.getTweets)
router.get('/signin', isAuthenticated, userController.getAdminSignInPage)
router.get('/logout', userController.adminLogout)
router.post('/signin', adminLocalAuth, sendToken, userController.adminSignin)
router.get('/', adminJWTAuth, adminController.getAdminHomePage)

module.exports = router
