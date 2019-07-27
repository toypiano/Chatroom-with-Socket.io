const passport = require('passport');

module.exports = function(app, db) {

  function ensureAuthenticated(req, res, next) {
    if(req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  }

  app.route('/')
    .get((req, res) => {
      res.render(process.cwd() + '/views/pug/index');
    });

  app.route('/auth/github')
    .get(passport.authenticate('github'));

  app.route('/auth/github/callback')
    .get(passport.authenticate('github', { failureRedirect: '/' }), (req, res) => {
      req.session.user_id = req.user.id;
      res.redirect('/chat');
    });
  
  app.route('/chat')
    .get(ensureAuthenticated, (req, res) => {
      console.log("req.session: \n" + JSON.stringify(req.session, null, 4));
      /*
      req.session: 
{
    "cookie": {
        "originalMaxAge": null,
        "expires": null,
        "httpOnly": true,
        "path": "/"
    },
    "passport": {
        "user": "43853846"
    },
    "user_id": "43853846"
}
      */
      console.log("req.user: \n" + JSON.stringify(req.user, null, 4));
      /* 
      req.user: 
{
    "_id": "5d3c0ee294a9db51041674fb",
    "id": "43853846",
    "chat_messages": 0,
    "created_on": "2019-07-27T08:44:18.510Z",
    "email": "No public email",
    "last_login": "2019-07-27T13:23:26.938Z",
    "login_count": 8,
    "name": "HAYOUN LEE",
    "photo": "https://avatars3.githubusercontent.com/u/43853846?v=4",
    "provider": "github"
}
      */
        res.render(process.cwd() + '/views/pug/chat', {user: req.user});
    });

  app.route('/logout')
    .get((req, res) => {
      req.logout();
      res.redirect('/');
    });
  
  // if any of the above routes didn't catch the request  
  app.use((req, res, next) => {
    res.status(400)
      .type('text')
      .send('Not Found');
  });
}