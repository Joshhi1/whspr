const express = require('express');
const { z } = require('./validate');
const { supabaseAdmin } = require('../config/supabase');
const { sendLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// GET /api/public/:username — look up basic public info to render the send page
router.get('/:username', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .eq('username', req.params.username.toLowerCase())
    .maybeSingle();

  if (error || !data) return res.status(404).json({ error: 'User not found', code: 'ERR_NOT_FOUND' });
  res.json({ profile: data });
});

const sendSchema = z.object({ body: z.string().min(1).max(500) });

// POST /api/public/:username/send — send an anonymous message. No auth, no
// sender identity captured anywhere. Rate-limited at the route level.
router.post('/:username/send', sendLimiter, async (req, res) => {
  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Message must be 1-500 characters', code: 'ERR_VALIDATION' });
  }

  const { data: recipient, error: lookupError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('username', req.params.username.toLowerCase())
    .maybeSingle();

  if (lookupError || !recipient) return res.status(404).json({ error: 'User not found', code: 'ERR_NOT_FOUND' });

  const { error } = await supabaseAdmin
    .from('messages')
    .insert({ recipient_id: recipient.id, body: parsed.data.body.trim() });

  if (error) return res.status(500).json({ error: 'Could not send message', code: 'ERR_SEND_FAILED' });
  res.status(201).json({ success: true });
});

module.exports = router;
