const path = require('path');
const express = require('express');
const cors = require('cors');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ message: 'Curasana API is running', routes: '/api/auth, /api/symptoms, ...' });
});

app.get('/api/health', async (_req, res) => {
  try {
    const prisma = require('./db');
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, database: 'connected' });
  } catch (err) {
    res.status(503).json({
      ok: false,
      database: 'failed',
      message: err.code === 'P1000'
        ? 'Invalid DATABASE_URL — update password in .env from Supabase'
        : err.message,
    });
  }
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/symptoms', require('./routes/symptoms'));
app.use('/api/allergies', require('./routes/allergies'));
app.use('/api/medications', require('./routes/medications'));
app.use('/api/timeline', require('./routes/timeline'));
app.use('/api/patients', require('./routes/patients'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
