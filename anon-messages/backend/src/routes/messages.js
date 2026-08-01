const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/messages — your own inbox, newest first
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await req.supabase
    .from('messages')
    .select('id, body, is_read, created_at')
    .eq('recipient_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'Could not load messages', code: 'ERR_LOAD_FAILED' });
  res.json({ messages: data });
});

// PATCH /api/messages/:id/read
router.patch('/:id/read', requireAuth, async (req, res) => {
  const { error } = await req.supabase
    .from('messages')
    .update({ is_read: true })
    .eq('id', req.params.id)
    .eq('recipient_id', req.user.id);

  if (error) return res.status(500).json({ error: 'Could not update message', code: 'ERR_UPDATE_FAILED' });
  res.json({ success: true });
});

// DELETE /api/messages/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const { error, count } = await req.supabase
    .from('messages')
    .delete({ count: 'exact' })
    .eq('id', req.params.id)
    .eq('recipient_id', req.user.id);

  if (error || !count) return res.status(403).json({ error: 'Could not delete message', code: 'ERR_FORBIDDEN' });
  res.json({ success: true });
});

module.exports = router;
