const db = require('../config/db');

async function seed() {
    try {
        console.log('[Seed] Seeding tournament_sponsor data...');

        // Clear existing tournament_sponsor entries
        await db.query('DELETE FROM tournament_sponsor');

        // Distribution:
        // Adidas (1): 3 tournaments (World Cup 2022, UEFA Euro 2024, World Cup 2026)
        // Coca-Cola (2): 3 tournaments (World Cup 2022, Copa América 2024, World Cup 2026)
        // Visa (3): 2 tournaments (World Cup 2022, World Cup 2026)
        // Qatar Airways (5): 2 tournaments (World Cup 2022, UEFA Euro 2024)
        // Budweiser (6): 2 tournaments (World Cup 2022, Copa América 2024)
        // McDonald's (7): 1 tournament (UEFA Euro 2024)
        // Hyundai (4): 0 tournaments
        // Wanda Group (8): 0 tournaments

        const records = [
            // Adidas (sponsor_id: 1) - 3 tournaments
            [1, 1, '2022–2026', 85000000.00],
            [2, 1, '2024–2026', 75000000.00],
            [4, 1, '2026–2030', 120000000.00],

            // Coca-Cola (sponsor_id: 2) - 3 tournaments
            [1, 2, '2022–2030', 90000000.00],
            [3, 2, '2024–2028', 60000000.00],
            [4, 2, '2026–2030', 110000000.00],

            // Visa (sponsor_id: 3) - 2 tournaments
            [1, 3, '2021–2026', 80000000.00],
            [4, 3, '2024–2028', 100000000.00],

            // Qatar Airways (sponsor_id: 5) - 2 tournaments
            [1, 5, '2023–2027', 90000000.00],
            [2, 5, '2024–2027', 65000000.00],

            // Budweiser (sponsor_id: 6) - 2 tournaments
            [1, 6, '2022–2026', 60000000.00],
            [3, 6, '2024–2026', 45000000.00],

            // McDonald's (sponsor_id: 7) - 1 tournament
            [2, 7, '2024–2026', 45000000.00],
        ];

        for (const [tournament_id, sponsor_id, term_cycle, contract_value] of records) {
            await db.query(
                `INSERT INTO tournament_sponsor (tournament_id, sponsor_id, term_cycle, contract_value) VALUES (?, ?, ?, ?)`,
                [tournament_id, sponsor_id, term_cycle, contract_value]
            );
        }

        console.log(`[Seed] Inserted ${records.length} tournament sponsorship records.`);

        // Verification query
        const [summary] = await db.query(`
            SELECT 
                s.sponsor_id,
                s.name AS sponsor_name,
                COUNT(ts.tournament_id) AS tournaments_count,
                COALESCE(SUM(ts.contract_value), 0) AS total_contract_value,
                GROUP_CONCAT(t.name ORDER BY t.tournament_id SEPARATOR ', ') AS sponsored_tournaments
            FROM sponsor s
            LEFT JOIN tournament_sponsor ts ON ts.sponsor_id = s.sponsor_id
            LEFT JOIN tournament t ON t.tournament_id = ts.tournament_id
            GROUP BY s.sponsor_id, s.name
            ORDER BY s.sponsor_id
        `);

        console.table(summary);
        console.log('[Seed] Seeding completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('[Seed] Error during seeding:', err);
        process.exit(1);
    }
}

seed();
