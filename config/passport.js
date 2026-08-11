const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { getCollection } = require('../database/index');

const users = () => getCollection('users');

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  },
  // verify callback
  async (accessToken, refreshToken, profile, done) => {
    try {
      // profile has emails, id, displayName
      const email = profile.emails && profile.emails[0] && profile.emails[0].value;
      if (!email) return done(null, false);

      let user = await users().findOne({ provider: 'google', providerId: profile.id });
      if (!user) {
        const result = await users().insertOne({
          provider: 'google',
          providerId: profile.id,
          email,
          displayName: profile.displayName,
          createdAt: new Date(),
        });
        user = { _id: result.insertedId, email, provider: 'google', providerId: profile.id };
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user._id.toString());
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await users().findOne({ _id: new require('mongodb').ObjectId(id) });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;