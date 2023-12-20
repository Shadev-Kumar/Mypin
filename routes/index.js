var express = require('express')
var router = express.Router()
let UserModel = require('./users')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const upload = require('./multer')

passport.use(new LocalStrategy(UserModel.authenticate()))

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index')
})

router.get('/register', function (req, res, next) {
  res.render('register')
})

router.get('/profile', isLoggedIn, async function (req, res,next) {
  const user = await UserModel.findOne({ username: req.session.passport.user })
  res.render('profile', { user })
})

router.post('/fileupload', isLoggedIn, upload.single("image"), async function (req, res, next) {
  const user = await UserModel.findOne({ username: req.session.passport.user })
  user.profileImage = req.file.filename
  await user.save()
  res.redirect('/profile')
})

router.post('/register', function (req, res) {
  var userdata = new UserModel({
    username: req.body.username,
    email: req.body.secret,
  })
  UserModel.register(userdata, req.body.password).then(function (
    registereduser,
  ) {
    passport.authenticate('local')(req, res, function () {
      res.redirect('/profile')
    })
  })
})

router.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/',
  }),
  function (req, res) {},
)

router.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) return next(err)
    res.redirect('/')
  })
})

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('/')
}

module.exports = router
