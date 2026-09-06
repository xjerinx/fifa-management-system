const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fifa_management',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
});

const promisePool = pool.promise();

// Test the database connection on startup
promisePool.query('SELECT 1')
    .then(() => {
        console.log(`[DB] Connected to MySQL database "${process.env.DB_NAME || 'fifa_management'}" successfully`);
    })
    .catch((err) => {
        console.error(`[DB] Connection failed: ${err.message}`);
        console.error(`[DB] Please ensure MySQL is running (e.g. via XAMPP) on ${process.env.DB_HOST || '127.0.0.1'}:3306`);
    });

module.exports = promisePool;