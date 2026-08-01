const express = require('express');
const { z } = require('./validate');
const { supabaseAdmin } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z
    .string()
    .min(3)
    .max(24)
    .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'),
  displayName: z.string().min(1).max(60),
});

// POST /api/auth/register — public sign-up with email + password
router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message, code: 'ERR_VALIDATION' });
  }
  const { email, password, username, displayName } = parsed.data;

  const { data: existing } = await supabaseAdmin.from('profiles').select('id').eq('username', username).maybeSingle();
  if (existing) return res.status(409).json({ error: 'That username is taken', code: 'ERR_USERNAME_TAKEN' });

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // no email verification flow wired up yet — auto-confirm
    user_metadata: { user_name: username, full_name: displayName },
  });

  if (error) {
    const code = error.message?.toLowerCase().includes('already') ? 'ERR_EMAIL_TAKEN' : 'ERR_REGISTER_FAILED';
    return res.status(400).json({ error: error.message || 'Could not create account', code });
  }

  // Sign them in immediately so the frontend gets a session back
  const { data: session, error: signInError } = await supabaseAdmin.auth.signInWithPassword({ email, password });
  if (signInError) return res.status(500).json({ error: 'Account created, please log in', code: 'ERR_AUTO_LOGIN_FAILED' });

  res.status(201).json({ session: session.session, user: { id: data.user.id, email: data.user.email } });
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid email or password format', code: 'ERR_VALIDATION' });

  const { email, password } = parsed.data;
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });

  if (error) return res.status(401).json({ error: 'Invalid email or password', code: 'ERR_LOGIN_FAILED' });

  res.json({ session: data.session, user: { id: data.user.id, email: data.user.email } });
});

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req, res) => {
  await supabaseAdmin.auth.admin.signOut(req.accessToken).catch(() => {});
  res.json({ success: true });
});

// GET /api/auth/session — current user + profile (works for Google-OAuth
// sessions too, since those also arrive as a normal Supabase access token)
router.get('/session', requireAuth, async (req, res) => {
  const { data: profile, error } = await req.supabase.from('profiles').select('*').eq('id', req.user.id).single();
  if (error) return res.status(404).json({ error: 'Profile not found', code: 'ERR_NO_PROFILE' });
  res.json({ user: { id: req.user.id, email: req.user.email }, profile });
});

const changePasswordSchema = z.object({ newPassword: z.string().min(8) });

// POST /api/auth/change-password
router.post('/change-password', requireAuth, async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Password must be at least 8 characters', code: 'ERR_VALIDATION' });

  const { error } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, { password: parsed.data.newPassword });
  if (error) return res.status(500).json({ error: 'Could not update password', code: 'ERR_UPDATE_FAILED' });
  res.json({ success: true });
});

module.exports = router;
