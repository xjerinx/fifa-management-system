const db = require('../config/db');

async function migrate() {
    try {
        console.log('[Migration] Starting tournament sponsorship migration...');

        // 1. Ensure tournament_sponsor table exists
        await db.query(`
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

        // 2. Check and add columns if table already existed without them
        const [cols] = await db.query("SHOW COLUMNS FROM tournament_sponsor LIKE 'term_cycle'");
        if (cols.length === 0) {
            await db.query("ALTER TABLE tournament_sponsor ADD COLUMN term_cycle VARCHAR(100) DEFAULT '2024–2026' AFTER sponsor_id");
            console.log('[Migration] Added term_cycle column');
        }

        const [valCols] = await db.query("SHOW COLUMNS FROM tournament_sponsor LIKE 'contract_value'");
        if (valCols.length === 0) {
            await db.query("ALTER TABLE tournament_sponsor ADD COLUMN contract_value DECIMAL(15,2) DEFAULT 5000000.00 AFTER term_cycle");
            console.log('[Migration] Added contract_value column');
        }

        // 3. Backfill existing tournament_sponsor entries with realistic values
        await db.query("UPDATE tournament_sponsor SET term_cycle = '2022–2026', contract_value = 85000000.00 WHERE sponsor_id = 1");
        await db.query("UPDATE tournament_sponsor SET term_cycle = '2022–2030', contract_value = 100000000.00 WHERE sponsor_id = 2");
        await db.query("UPDATE tournament_sponsor SET term_cycle = '2021–2026', contract_value = 75000000.00 WHERE sponsor_id = 3");
        await db.query("UPDATE tournament_sponsor SET term_cycle = '2023–2030', contract_value = 65000000.00 WHERE sponsor_id = 4");
        await db.query("UPDATE tournament_sponsor SET term_cycle = '2023–2027', contract_value = 90000000.00 WHERE sponsor_id = 5");
        await db.query("UPDATE tournament_sponsor SET term_cycle = '2023–2026', contract_value = 60000000.00 WHERE sponsor_id = 6");
        await db.query("UPDATE tournament_sponsor SET term_cycle = '2024–2026', contract_value = 45000000.00 WHERE sponsor_id = 7");
        await db.query("UPDATE tournament_sponsor SET term_cycle = '2022–2030', contract_value = 80000000.00 WHERE sponsor_id = 8");
        console.log('[Migration] Backfilled term_cycle and contract_value');

        // 4. Drop match_sponsor table completely
        await db.query("DROP TABLE IF EXISTS match_sponsor");
        console.log('[Migration] Dropped match_sponsor table successfully');

        // 5. Verify tournament_sponsor
        const [rows] = await db.query(`
            SELECT ts.*, t.name as tournament_name, s.name as sponsor_name 
            FROM tournament_sponsor ts
            JOIN tournament t ON t.tournament_id = ts.tournament_id
            JOIN sponsor s ON s.sponsor_id = ts.sponsor_id
            LIMIT 5
        `);
        console.log('[Migration] Verified tournament_sponsor records:');
        console.table(rows);

        console.log('[Migration] Tournament sponsorship migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('[Migration] Migration error:', err);
        process.exit(1);
    }
}

migrate();
