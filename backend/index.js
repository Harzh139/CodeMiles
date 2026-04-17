require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const repoRoutes = require('./routes/repo');
const aiRoutes = require('./routes/ai');
const pushRoutes = require('./routes/push');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    domain: process.env.COOKIE_DOMAIN,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

const rateLimit = require('express-rate-limit');

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 15,
  message: { error: 'Too many AI requests from this IP, please try again in an hour.' }
});

app.use('/auth', authRoutes);
app.use('/repo', repoRoutes);
app.use('/ai', aiLimiter, aiRoutes);
app.use('/push', pushRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve frontend in production
const path = require('path');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.use((req, res, next) => {
    // Only serve index.html for non-API routes
    if (req.method === 'GET' && !req.path.startsWith('/auth') && !req.path.startsWith('/repo') && !req.path.startsWith('/ai') && !req.path.startsWith('/push')) {
      res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
    } else {
      next();
    }
  });
}

app.listen(PORT, () => {
  console.log(`Antigravity backend running on port ${PORT}`);
});
