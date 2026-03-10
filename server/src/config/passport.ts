import passport from 'passport';
import { Strategy as GoogleStrategy, type Profile } from 'passport-google-oauth20';
import { env } from './env';

export type GoogleProfile = Profile;

export function configurePassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
        // State verification is handled manually in auth.routes.ts by comparing
        // the `state` query param against the signed `oauth_state` httpOnly cookie,
        // giving CSRF protection without relying on Passport's session-based check.
        state: false,
        passReqToCallback: false,
      },
      (_accessToken, _refreshToken, profile, done) => {
        done(null, profile);
      },
    ),
  );
}
