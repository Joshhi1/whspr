const { supabaseForToken, supabaseAdmin } = require('../config/supabase');

// Verifies the Supabase access token sent by the frontend (Authorization: Bearer <token>)
// and attaches `req.user` and a request-scoped `req.supabase` client (RLS-respecting).
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated', code: 'ERR_NO_TOKEN' });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ error: 'Session expired, please log in again', code: 'ERR_INVALID_TOKEN' });
  }

  req.user = data.user;
  req.accessToken = token;
  req.supabase = supabaseForToken(token);
  next();
}

module.exports = { requireAuth };
