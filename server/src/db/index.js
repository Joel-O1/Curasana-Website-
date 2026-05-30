require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');

const prisma = new PrismaClient;

// Configure Local PostgreSQL Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;
module.exports = prisma;

//can use it in other files like this:
// const pool = require('./db');
// const result = await pool.query('SELECT * FROM users', (err, res) => {
//   if (err) {
//     console.error('Error executing query', err.stack);
//   } else {
//     console.log(res.rows);
//   }
// });