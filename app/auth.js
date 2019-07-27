const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;

module.exports = function (app, db) {

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    db.collection('chatusers').findOne(
      {id: id},
      (err, doc) => {
        done(null, doc);
      }
    );
  });

  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:8080/auth/github/callback"
  }, function(accessToken, refreshToken, profile, cb) {
    console.log(JSON.stringify(profile, null, 4)); // check data structure
    // modify below according to the log

    /* collection.findAndModify is decrecated. use findOneAndUpdate|Replace|Delete instead */
    // db.collection('chatusers').findAndModify(
    //   {id: profile.id},
    //   {},
    //   {$setOnInsert:{
    //     id:profile.id,
    //     name: profile.displayName || 'Anonymous',
    //     photo: profile.photos[0].value || '',
    //     email: profile.email || 'No public email',
    //     created_on: new Date(),
    //     provider: profile.provider || '',
    //     chat_messages: 0
    //   },$set:{
    //     last_login: new Date()
    //   },$inc:{
    //     login_count: 1
    //   }},
    //   {upsert:true, new: true},
    //   (err, doc) => {
    //     return cb(null, doc.value);
    //   }
    // );
    db.collection('chatusers').findOneAndUpdate(
      {id: profile.id}, // filter
      {$setOnInsert:{ // update
        id: profile.id,
        name: profile.displayName || 'Anonymous',
        photo: profile.photos[0].value || '',
        email: profile.email || 'No public email',
        created_on: new Date(),
        provider: profile.provider || '',
        chat_messages: 0
      },$set: {
        last_login: new Date()
      },$inc: {
        login_count: 1
      }},
      {upsert: true, returnOriginal: false}, // options
      (err, doc) => {
        console.log("doc: \n" + JSON.stringify(doc, null, 4));
//         doc: 
// {
//     "lastErrorObject": {
//         "n": 1,
//         "updatedExisting": true
//     },
//     "value": {
//         "_id": "5d3c0ee294a9db51041674fb",
//         "id": "43853846",
//         "chat_messages": 0,
//         "created_on": "2019-07-27T08:44:18.510Z",
//         "email": "No public email",
//         "last_login": "2019-07-27T13:23:26.938Z",
//         "login_count": 8,
//         "name": "HAYOUN LEE",
//         "photo": "https://avatars3.githubusercontent.com/u/43853846?v=4",
//         "provider": "github"
//     },
//     "ok": 1,
//     "operationTime": "6718333040067608578",
//     "$clusterTime": {
//         "clusterTime": "6718333040067608578",
//         "signature": {
//             "hash": "matidt1c1M34nzxlMmWm3igr3BU=",
//             "keyId": "6697737615321333762"
//         }
//     }
// }

        return cb(null, doc.value); 
      }
    );
  }
  ));
}