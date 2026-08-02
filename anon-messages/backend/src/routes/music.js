const express = require('express');

const router = express.Router();

// GET /api/public/music/search?q=... — proxies Deezer's public search API.
// Deezer's API works great server-to-server but doesn't send CORS headers,
// so the browser can't call it directly — this route exists purely to get
// around that, not because the data itself needs to be private.
router.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ tracks: [] });

  try {
    const deezerRes = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=15`);
    if (!deezerRes.ok) throw new Error('Deezer request failed');
    const data = await deezerRes.json();

    const tracks = (data.data || []).map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist?.name || 'Unknown artist',
      albumArt: t.album?.cover_medium || t.album?.cover || null,
      previewUrl: t.preview || null, // 30-second preview clip, no auth needed
    }));

    res.json({ tracks });
  } catch {
    res.status(502).json({ error: 'Could not search music right now', code: 'ERR_MUSIC_SEARCH_FAILED' });
  }
});

module.exports = router;
