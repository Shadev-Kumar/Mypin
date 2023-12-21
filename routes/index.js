var express = require('express')
var router = express.Router()
let UserModel = require('./users')
let postsModel = require('./posts')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const upload = require('./multer')

passport.use(new LocalStrategy(UserModel.authenticate()))

router.get('/', function (req, res, next) {
  res.render('index', { nav: false })
})

router.get('/register', function (req, res, next) {
  res.render('register', { nav: false })
})

router.get('/profile', isLoggedIn, async function (req, res, next) {
  const user = await UserModel.findOne({
    username: req.session.passport.user,
  }).populate('posts')
  res.render('profile', { user, nav: true })
})

router.get('/create', isLoggedIn, async function (req, res, next) {
  const user = await UserModel.findOne({ username: req.session.passport.user })
  res.render('create', { user, nav: true })
})

router.get('/showposts', isLoggedIn, async function (req, res, next) {
  const user = await UserModel.findOne({
    username: req.session.passport.user,
  }).populate('posts')
  res.render('showposts', { user, nav: true })
})

router.get('/feed', isLoggedIn, async function (req, res, next) {
  const user = await UserModel.findOne({ username: req.session.passport.user })
  const posts = await postsModel.find().populate('user')

  res.render('feed', { user,posts, nav: true })
})

router.post(
  '/createpost',
  isLoggedIn,
  upload.single('postimage'),
  async function (req, res, next) {
    const user = await UserModel.findOne({
      username: req.session.passport.user,
    })
    const post = await postsModel.create({
      user: user._id,
      title: req.body.title,
      description: req.body.description,
      image: req.file.filename,
    })

    user.posts.push(post._id)
    await user.save()
    res.redirect('/profile')
  },
)

router.post('/fileupload', isLoggedIn, upload.single('image'), async function (
  req,
  res,
  next,
) {
  const user = await UserModel.findOne({ username: req.session.passport.user })
  user.profileImage = req.file.filename
  await user.save()
  res.redirect('/profile')
})

router.post('/register', function (req, res) {
  var userdata = new UserModel({
    username: req.body.username,
    name: req.body.name,
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
