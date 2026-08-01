const express = require('express');
const multer = require('multer');
const { z } = require('./validate');
const { requireAuth } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/profile/:id
router.get('/:id', requireAuth, async (req, res) => {
  const { data, error } = await req.supabase.from('profiles').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Profile not found', code: 'ERR_NOT_FOUND' });
  res.json({ profile: data });
});

const updateSchema = z.object({
  display_name: z.string().min(1).max(60).optional(),
  bio: z.string().max(300).optional(),
});

// PATCH /api/profile — update own display name / bio
router.patch('/', requireAuth, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid profile data', code: 'ERR_VALIDATION' });

  const { data, error } = await req.supabase
    .from('profiles')
    .update(parsed.data)
    .eq('id', req.user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Could not update profile', code: 'ERR_UPDATE_FAILED' });
  res.json({ profile: data });
});

// POST /api/profile/avatar — upload a new profile picture
router.post('/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded', code: 'ERR_NO_FILE' });
  if (!req.file.mimetype.startsWith('image/')) {
    return res.status(400).json({ error: 'Only image files are allowed', code: 'ERR_INVALID_TYPE' });
  }

  const ext = req.file.originalname.split('.').pop();
  const path = `${req.user.id}/avatar-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('avatars')
    .upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: true });

  if (uploadError) return res.status(500).json({ error: 'Upload failed', code: 'ERR_UPLOAD_FAILED' });

  const { data: publicUrl } = supabaseAdmin.storage.from('avatars').getPublicUrl(path);

  const { data, error } = await req.supabase
    .from('profiles')
    .update({ avatar_url: publicUrl.publicUrl })
    .eq('id', req.user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Could not save avatar', code: 'ERR_UPDATE_FAILED' });
  res.json({ profile: data });
});

module.exports = router;
