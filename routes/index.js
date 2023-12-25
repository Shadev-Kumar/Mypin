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

router.get('/createdpins', isLoggedIn, async function (req, res, next) {
  const user = await UserModel.findOne({
    username: req.session.passport.user,
  }).populate('posts')
  res.render('createdpins', { user, nav: true })
})

router.get('/like/post/:id', isLoggedIn, async function (req, res, next) {
  const user = await UserModel.findOne({ username: req.session.passport.user })
  const post = await postsModel.findOne({ _id: req.params.id })
  if (post.likes.indexOf(user._id) === -1) {
    post.likes.push(user._id)
  } else {
    post.likes.splice(post.likes.indexOf(user._id), 1)
  }
  await post.save()
  res.redirect(`/showpost/${req.params.id}`)
})

router.get('/showpost/:post_id', isLoggedIn, async function (req, res, next) {
  try {
    const requestedPostId = req.params.post_id;
    const user = await UserModel.findOne({ username: req.session.passport.user })
    const allpost = await postsModel.find().populate('user');

    const selectedPost = allpost.find(post => post._id.toString() === requestedPostId);

    if (!selectedPost) {
      return res.status(404).send('Post not found');
    }
    res.render('showpost', {allpost, userPost: selectedPost, nav: true,user });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get('/searchpins/:query', isLoggedIn, async function (req, res, next) {
  const regexPattern = new RegExp(`${req.params.query}`, 'i');
 const pins = await postsModel.find({
  $or: [
    { title: regexPattern },
    { description: regexPattern },
  ]
}).populate('user');
  res.json(pins)
})

router.get('/feed', isLoggedIn, async function (req, res, next) {
  try {
    const posts = await postsModel.find().populate('user');
    res.render('feed', { posts, nav: true });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

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

router.post('/login',
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
