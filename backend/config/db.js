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
        } catch (e) {
            console.warn('[DB] Player club check:', e.message);
        }

        // Ensure player.position can safely accept any standard position string without truncation error
        try {
            await promisePool.query("ALTER TABLE player MODIFY COLUMN position VARCHAR(50) NOT NULL DEFAULT 'Forward'");
        } catch (e) {
            console.warn('[DB] Player position check:', e.message);
        }

        // Ensure player.team_id is nullable for club/unaffiliated players
        try {
            await promisePool.query("ALTER TABLE player MODIFY COLUMN team_id INT NULL DEFAULT NULL");
        } catch (e) {
            console.warn('[DB] Player team_id nullability check:', e.message);
        }

        // Ensure player.preferred_foot is flexible VARCHAR
        try {
            await promisePool.query("ALTER TABLE player MODIFY COLUMN preferred_foot VARCHAR(20) DEFAULT 'Right'");
        } catch (e) {}

        // Ensure match_referees junction table exists for Many-to-Many referee assignments (RUN FIRST)
        try {
            await promisePool.query(`
                CREATE TABLE IF NOT EXISTS match_referees (
                    match_id INT NOT NULL,
                    referee_id INT NOT NULL,
                    role VARCHAR(100) NOT NULL DEFAULT 'Main Referee',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (match_id, referee_id),
                    KEY idx_mr_match (match_id),
                    KEY idx_mr_referee (referee_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
            `);

            // Try adding foreign keys safely (non-blocking if MySQL column type/engine differs)
            try {
                await promisePool.query(`
                    ALTER TABLE match_referees
                    ADD CONSTRAINT fk_mr_match FOREIGN KEY (match_id) REFERENCES \`match\` (match_id) ON DELETE CASCADE ON UPDATE CASCADE
                `);
            } catch (fkErr) {}
            try {
                await promisePool.query(`
                    ALTER TABLE match_referees
                    ADD CONSTRAINT fk_mr_referee FOREIGN KEY (referee_id) REFERENCES referee (referee_id) ON DELETE CASCADE ON UPDATE CASCADE
                `);
            } catch (fkErr) {}

            // Ensure role column exists in match_referees
            try {
                const [mrCols] = await promisePool.query("SHOW COLUMNS FROM match_referees LIKE 'role'");
                if (mrCols.length === 0) {
                    await promisePool.query("ALTER TABLE match_referees ADD COLUMN role VARCHAR(100) NOT NULL DEFAULT 'Main Referee' AFTER referee_id");
                    console.log('[DB] Added missing "role" column to match_referees table');
                }
            } catch (e) {}

            // Migrate data from legacy match_referee table if it existed
            try {
                const [legacyExists] = await promisePool.query("SHOW TABLES LIKE 'match_referee'");
                if (legacyExists.length > 0) {
                    await promisePool.query(`
                        INSERT IGNORE INTO match_referees (match_id, referee_id, role)
                        SELECT mr.match_id, mr.referee_id, COALESCE(r.role, 'Main Referee')
                        FROM match_referee mr
                        LEFT JOIN referee r ON r.referee_id = mr.referee_id
                    `);
                    console.log('[DB] Migrated legacy match_referee records to match_referees');
                }
            } catch (e) {}
        } catch (e) {
            console.warn('[DB] match_referees check:', e.message);
        }

        // Ensure tournament_sponsor table and columns exist
        try {
            await promisePool.query(`
                CREATE TABLE IF NOT EXISTS tournament_sponsor (
                    tournament_id INT(11) NOT NULL,
                    sponsor_id INT(11) NOT NULL,
                    term_cycle VARCHAR(100) DEFAULT '2024–2026',
                    contract_value DECIMAL(15,2) DEFAULT 5000000.00,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (tournament_id, sponsor_id),
                    KEY fk_tsponsor_sponsor (sponsor_id)
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
        } catch (e) {
            console.warn('[DB] tournament_sponsor check:', e.message);
        }

        // Ensure ticket_booking table exists for fan ticketing portal
        try {
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
                    INDEX idx_booking_match (match_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
            `);
        } catch (e) {
            console.warn('[DB] ticket_booking check:', e.message);
        }

        // Clean up any deprecated match_sponsor table
        try {
            await promisePool.query("DROP TABLE IF EXISTS match_sponsor");
        } catch (e) {}

        // Clean up unutilized league table and foreign key
        try {
            const [teamFk] = await promisePool.query(`
                SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'team' AND CONSTRAINT_NAME = 'fk_team_league'
            `);
            if (teamFk.length > 0) {
                await promisePool.query('ALTER TABLE `team` DROP FOREIGN KEY `fk_team_league`');
            }
            const [teamCols] = await promisePool.query("SHOW COLUMNS FROM `team` LIKE 'league_id'");
            if (teamCols.length > 0) {
                await promisePool.query('ALTER TABLE `team` DROP COLUMN `league_id`');
            }
            await promisePool.query("DROP TABLE IF EXISTS `league`");
        } catch (err) {}
    })
    .catch((err) => {
        console.error(`[DB] Connection failed: ${err.message}`);
        console.error(`[DB] Please ensure MySQL is running (e.g. via XAMPP) on ${process.env.DB_HOST || '127.0.0.1'}:3306`);
    });

module.exports = promisePool;