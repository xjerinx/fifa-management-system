const db = require('../config/db');

async function createTicketBookingTable() {
    try {
        console.log('[Migration] Ensuring ticket_booking table exists in MySQL...');

        await db.query(`
            CREATE TABLE IF NOT EXISTS ticket_booking (
                booking_id INT AUTO_INCREMENT PRIMARY KEY,
                booking_ref VARCHAR(50) UNIQUE NOT NULL,
                user_email VARCHAR(255) NOT NULL,
                user_name VARCHAR(100) DEFAULT 'Fan User',
                user_type ENUM('fan', 'organization') DEFAULT 'fan',
                match_id INT NOT NULL,
                ticket_type VARCHAR(50) NOT NULL DEFAULT 'Standard',
                quantity INT NOT NULL DEFAULT 1,
                unit_price DECIMAL(10,2) NOT NULL DEFAULT 500.00,
                total_price DECIMAL(10,2) NOT NULL DEFAULT 500.00,
                status ENUM('CONFIRMED', 'CANCELLED') DEFAULT 'CONFIRMED',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_booking_user (user_email),
                INDEX idx_booking_match (match_id),
                CONSTRAINT fk_ticket_match FOREIGN KEY (match_id) REFERENCES \`match\` (match_id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `);

        console.log('[Migration] Table ticket_booking created or already exists.');

        // Seed 2 initial demonstration tickets if empty
        const [existing] = await db.query('SELECT COUNT(*) as count FROM ticket_booking');
        if (existing[0].count === 0) {
            // Pick two valid matches
            const [matches] = await db.query('SELECT match_id FROM `match` ORDER BY match_date DESC LIMIT 2');
            if (matches.length > 0) {
                await db.query(`
                    INSERT INTO ticket_booking 
                    (booking_ref, user_email, user_name, match_id, ticket_type, quantity, unit_price, total_price, status)
                    VALUES 
                    ('FIFA-001', 'fan@fifa.org', 'Alex Morgan', ?, 'Standard', 2, 500.00, 1000.00, 'CONFIRMED'),
                    ('FIFA-002', 'fan@fifa.org', 'Alex Morgan', ?, 'Premium', 1, 1000.00, 1000.00, 'CONFIRMED')
                `, [matches[0].match_id, matches[1] ? matches[1].match_id : matches[0].match_id]);
                console.log('[Migration] Seeded initial demo ticket bookings.');
            }
        }

        const [rows] = await db.query(`
            SELECT tb.booking_ref, tb.user_name, tb.ticket_type, tb.quantity, tb.total_price, m.match_date 
            FROM ticket_booking tb
            JOIN \`match\` m ON m.match_id = tb.match_id
        `);
        console.log('[Migration] Verified ticket_booking table records:');
        console.table(rows);

        process.exit(0);
    } catch (err) {
        console.error('[Migration] Failed to create ticket_booking table:', err);
        process.exit(1);
    }
}

createTicketBookingTable();
