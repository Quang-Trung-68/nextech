const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { Strategy: FacebookStrategy } = require('passport-facebook');
const authService = require('../services/auth.service');

/**
 * Google OAuth 2.0 Strategy — stateless (no session).
 *
 * Verify callback delegates all DB logic to authService.findOrCreateOAuthUser,
 * which is designed generically so adding GitHub / Facebook later only requires
 * a new strategy here — NO changes to the service layer.
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error('Google account does not have a verified email.'));
        }

        const user = await authService.findOrCreateOAuthUser({
          provider: 'google',
          providerAccountId: profile.id,
          email,
          name: profile.displayName || email.split('@')[0],
        });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

/**
 * Facebook OAuth 2.0 Strategy.
 */
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ['id', 'emails', 'name', 'displayName'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(null, false, {
            message: 'no_email'
          });
        }

        const name = profile.displayName 
          || `${profile.name?.givenName} ${profile.name?.familyName}`.trim();

        const user = await authService.findOrCreateOAuthUser({
          provider: 'facebook',
          providerAccountId: profile.id,
          email,
          name,
        });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Stateless API — NO serializeUser / deserializeUser required.

module.exports = passport;
