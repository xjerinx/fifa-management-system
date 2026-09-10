let initPromise = null;

async function ensureMatchRefereesTable(db) {
    if (initPromise) return initPromise;

    initPromise = (async () => {
        try {
            await db.query(`
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

            // Ensure role column exists if table existed previously without it
            try {
                const [cols] = await db.query("SHOW COLUMNS FROM match_referees LIKE 'role'");
                if (cols.length === 0) {
                    await db.query("ALTER TABLE match_referees ADD COLUMN role VARCHAR(100) NOT NULL DEFAULT 'Main Referee' AFTER referee_id");
                }
            } catch (e) {}

            // Migrate legacy match_referee records if table existed
            try {
                const [legacy] = await db.query("SHOW TABLES LIKE 'match_referee'");
                if (legacy.length > 0) {
                    await db.query(`
                        INSERT IGNORE INTO match_referees (match_id, referee_id, role)
                        SELECT mr.match_id, mr.referee_id, COALESCE(r.role, 'Main Referee')
                        FROM match_referee mr
                        LEFT JOIN referee r ON r.referee_id = mr.referee_id
                    `);
                }
            } catch (e) {}
        } catch (err) {
            console.error('[DB] Auto-creating match_referees table failed:', err.message);
            initPromise = null; // allow retry on next call
        }
    })();

    return initPromise;
}

module.exports = { ensureMatchRefereesTable };
