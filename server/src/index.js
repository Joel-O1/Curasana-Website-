const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../../.env' });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Curasana API is running' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

//========== AUTH ==========
const authRoutes = require('./routes/auth');
app.use('./api/auth', authRoutes);