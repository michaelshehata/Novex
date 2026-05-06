const { doubleCsrf } = require('csrf-csrf');

const { doubleCsrfProtection } = doubleCsrf({
  getSecret: () => {
    if (!process.env.SESSION_SECRET) {
      throw new Error('SESSION_SECRET not set');
    }
    return process.env.SESSION_SECRET;
  },
  getSessionIdentifier: (req) => req.sessionID,
  cookieName: 'psifi.x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  },
  getCsrfTokenFromRequest: (req) =>
    req.headers['x-csrf-token'] || (req.body && req.body._csrf) || '',
});

module.exports = doubleCsrfProtection;
