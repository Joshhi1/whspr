require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');

const { apiLimiter, authLimiter } = require('./src/middleware/rateLimiter');

const authRoutes = require('./src/routes/auth');
const profileRoutes = require('./src/routes/profile');
const messagesRoutes = require('./src/routes/messages');
const publicRoutes = require('./src/routes/public');
const musicRoutes = require('./src/routes/music');

const app = express();

// Render (and most hosting platforms) sit behind a reverse proxy, which sets
// the X-Forwarded-For header. Express needs to be told to trust it, or
// express-rate-limit throws on every request trying to validate that header.
app.set('trust proxy', 1);

// --- Core security & performance middleware -------------------------------
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https://*.supabase.co', 'https://api.dicebear.com', 'https://*.dzcdn.net'],
        connectSrc: ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co'],
        mediaSrc: ["'self'", 'https://*.dzcdn.net'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      },
    },
  })
);
app.use(compression());
app.use(express.json({ limit: '1mb' }));

const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true,
  })
);

// --- Health check ------------------------------------------------------------
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// --- Feature routes ----------------------------------------------------------
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/profile', apiLimiter, profileRoutes);
app.use('/api/messages', apiLimiter, messagesRoutes);
app.use('/api/public/music', apiLimiter, musicRoutes);
app.use('/api/public', apiLimiter, publicRoutes);

// --- 404 & error handling -----------------------------------------------------
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found', code: 'ERR_NOT_FOUND' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error', code: 'ERR_INTERNAL' });
});

// --- Serve the built frontend in production ----------------------------------
const path = require('path');
const fs = require('fs');
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
