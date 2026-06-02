const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

//========== AUTH ==========
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

//========== Protected Routes ===========
const healthRoutes = require('./routes/healthRoutes');
app.use('/api', healthRoutes);//all routes in healthRoutes will be prefixed with /api and protected by the auth middleware


app.get('/', (req, res) => {
    res.json({ message: 'Curasana API is running' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

