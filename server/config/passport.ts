import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

interface User {
  id: string;
  displayName: string;
  email: string;
  photo: string;
}

passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: `${process.env.SERVER_URL || 'http://localhost:3000'}/auth/google/callback`,
    },
    (accessToken, refreshToken, profile, done) => {
      const email = profile.emails?.[0]?.value || '';

      // Проверка разрешенного email
      const allowedEmail = 'kirill.j.kolesnikov@gmail.com';
      if (email !== allowedEmail) {
        return done(null, false, { message: 'Access denied. Only authorized email can login.' });
      }

      const user: User = {
        id: profile.id,
        displayName: profile.displayName,
        email: email,
        photo: profile.photos?.[0]?.value || '',
      };
      return done(null, user);
    }
  )
);
