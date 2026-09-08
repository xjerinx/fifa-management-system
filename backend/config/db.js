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

// Test the database connection on startup and ensure schema compatibility
promisePool.query('SELECT 1')
    .then(async () => {
        console.log(`[DB] Connected to MySQL database "${process.env.DB_NAME || 'fifa_management'}" successfully`);
        try {
            const [cols] = await promisePool.query("SHOW COLUMNS FROM player LIKE 'club'");
            if (cols.length === 0) {
                await promisePool.query('ALTER TABLE player ADD COLUMN club VARCHAR(100) DEFAULT NULL AFTER team_id');
                console.log('[DB] Added missing "club" column to player table');
            }

            // Ensure tournament_sponsor table and columns exist
            await promisePool.query(`
                CREATE TABLE IF NOT EXISTS tournament_sponsor (
                    tournament_id INT(11) NOT NULL,
                    sponsor_id INT(11) NOT NULL,
                    term_cycle VARCHAR(100) DEFAULT '2024–2026',
                    contract_value DECIMAL(15,2) DEFAULT 5000000.00,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (tournament_id, sponsor_id),
                    KEY fk_tsponsor_sponsor (sponsor_id),
                    CONSTRAINT fk_tsponsor_tournament FOREIGN KEY (tournament_id) REFERENCES tournament (tournament_id) ON DELETE CASCADE ON UPDATE CASCADE,
                    CONSTRAINT fk_tsponsor_sponsor FOREIGN KEY (sponsor_id) REFERENCES sponsor (sponsor_id) ON DELETE CASCADE ON UPDATE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
            `);

            const [tsCols] = await promisePool.query("SHOW COLUMNS FROM tournament_sponsor LIKE 'term_cycle'");
            if (tsCols.length === 0) {
                await promisePool.query("ALTER TABLE tournament_sponsor ADD COLUMN term_cycle VARCHAR(100) DEFAULT '2024–2026' AFTER sponsor_id");
            }
            const [valCols] = await promisePool.query("SHOW COLUMNS FROM tournament_sponsor LIKE 'contract_value'");
            if (valCols.length === 0) {
                await promisePool.query("ALTER TABLE tournament_sponsor ADD COLUMN contract_value DECIMAL(15,2) DEFAULT 5000000.00 AFTER term_cycle");
            }

            // Ensure ticket_booking table exists for fan ticketing portal
            await promisePool.query(`
                CREATE TABLE IF NOT EXISTS ticket_booking (
                    booking_id INT AUTO_INCREMENT PRIMARY KEY,
                    booking_ref VARCHAR(50) UNIQUE NOT NULL,
                    user_email VARCHAR(255) NOT NULL,
                    user_name VARCHAR(100) DEFAULT 'Fan User',
                    user_type ENUM('fan', 'organization') DEFAULT 'fan',
                    match_id INT NOT NULL,
                    ticket_type VARCHAR(50) NOT NULL DEFAULT 'Standard',
                    quantity INT NOT NULL DEFAULT 1,
                    unit_price DECIMAL(10,2) NOT NULL DEFAULT 6500.00,
                    total_price DECIMAL(10,2) NOT NULL DEFAULT 6500.00,
                    status ENUM('CONFIRMED', 'CANCELLED') DEFAULT 'CONFIRMED',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_booking_user (user_email),
                    INDEX idx_booking_match (match_id),
                    CONSTRAINT fk_ticket_match FOREIGN KEY (match_id) REFERENCES \`match\` (match_id) ON DELETE CASCADE ON UPDATE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
            `);

            // Clean up any deprecated match_sponsor table
            await promisePool.query("DROP TABLE IF EXISTS match_sponsor");
        } catch (e) {
            console.warn('[DB] Schema check warning:', e.message);
        }
    })
    .catch((err) => {
        console.error(`[DB] Connection failed: ${err.message}`);
        console.error(`[DB] Please ensure MySQL is running (e.g. via XAMPP) on ${process.env.DB_HOST || '127.0.0.1'}:3306`);
    });

module.exports = promisePool;