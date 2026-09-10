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

            // Ensure match_referees junction table exists for Many-to-Many referee assignments
            await promisePool.query(`
                CREATE TABLE IF NOT EXISTS match_referees (
                    match_id INT NOT NULL,
                    referee_id INT NOT NULL,
                    role VARCHAR(100) NOT NULL DEFAULT 'Main Referee',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (match_id, referee_id),
                    KEY fk_mr_referee (referee_id),
                    CONSTRAINT fk_mr_match FOREIGN KEY (match_id) REFERENCES \`match\` (match_id) ON DELETE CASCADE ON UPDATE CASCADE,
                    CONSTRAINT fk_mr_referee FOREIGN KEY (referee_id) REFERENCES referee (referee_id) ON DELETE CASCADE ON UPDATE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
            `);

            // Ensure role column exists in match_referees
            try {
                const [mrCols] = await promisePool.query("SHOW COLUMNS FROM match_referees LIKE 'role'");
                if (mrCols.length === 0) {
                    await promisePool.query("ALTER TABLE match_referees ADD COLUMN role VARCHAR(100) NOT NULL DEFAULT 'Main Referee' AFTER referee_id");
                    console.log('[DB] Added missing "role" column to match_referees table');
                }
            } catch (e) {
                // table might not exist if DB offline
            }

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
            } catch (e) {
                // Ignore if legacy table doesn't exist
            }

            // Clean up any deprecated match_sponsor table
            await promisePool.query("DROP TABLE IF EXISTS match_sponsor");

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
            } catch (err) {
                // Ignore if already dropped or database user lacks permissions
            }
        } catch (e) {
            console.warn('[DB] Schema check warning:', e.message);
        }
    })
    .catch((err) => {
        console.error(`[DB] Connection failed: ${err.message}`);
        console.error(`[DB] Please ensure MySQL is running (e.g. via XAMPP) on ${process.env.DB_HOST || '127.0.0.1'}:3306`);
    });

module.exports = promisePool;