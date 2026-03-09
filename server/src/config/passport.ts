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
        // We manually build the initial OAuth redirect (see app.ts) which doesn't
        // include a `state` param, so Passport's built-in state/CSRF check must be
        // disabled — otherwise the callback always fails with "missing state".
        state: false,
      },
      (_accessToken, _refreshToken, profile, done) => {
        done(null, profile);
      },
    ),
  );
}
