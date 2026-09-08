const db = require('../config/db');

exports.getAll = async (req, res, next) => {
    try {
        const { email } = req.query;
        let query = `
            SELECT tb.*,
                tb.booking_ref AS booking_reference,
                tb.total_price AS total_amount,
                tb.unit_price AS price_per_ticket,
                tb.user_name AS fan_name,
                tb.user_email AS fan_email,
                ht.name AS home_team,
                at.name AS away_team,
                s.name AS stadium_name,
                s.city AS stadium_city,
                tr.name AS tournament_name,
                m.match_date,
                m.match_time,
                m.stage
            FROM ticket_booking tb
            INNER JOIN \`match\` m ON m.match_id = tb.match_id
            INNER JOIN team ht ON ht.team_id = m.home_team_id
            INNER JOIN team at ON at.team_id = m.away_team_id
            LEFT JOIN stadium s ON s.stadium_id = m.stadium_id
            LEFT JOIN tournament tr ON tr.tournament_id = m.tournament_id
        `;
        const params = [];
        if (email) {
            query += ` WHERE tb.user_email = ?`;
            params.push(email);
        }
        query += ` ORDER BY tb.created_at DESC`;

        const [rows] = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};

exports.getByRef = async (req, res, next) => {
    try {
        const { ref } = req.params;
        const [rows] = await db.query(`
            SELECT tb.*,
                tb.booking_ref AS booking_reference,
                tb.total_price AS total_amount,
                tb.unit_price AS price_per_ticket,
                tb.user_name AS fan_name,
                tb.user_email AS fan_email,
                ht.name AS home_team,
                at.name AS away_team,
                s.name AS stadium_name,
                s.city AS stadium_city,
                tr.name AS tournament_name,
                m.match_date,
                m.match_time,
                m.stage
            FROM ticket_booking tb
            INNER JOIN \`match\` m ON m.match_id = tb.match_id
            INNER JOIN team ht ON ht.team_id = m.home_team_id
            INNER JOIN team at ON at.team_id = m.away_team_id
            LEFT JOIN stadium s ON s.stadium_id = m.stadium_id
            LEFT JOIN tournament tr ON tr.tournament_id = m.tournament_id
            WHERE tb.booking_ref = ?
        `, [ref]);

        if (!rows.length) {
            return res.status(404).json({ success: false, message: 'Ticket booking not found' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
    try {
        const { match_id, ticket_type, quantity, user_email, user_name, fan_email, fan_name } = req.body;
        if (!match_id) {
            return res.status(400).json({ success: false, message: 'Match selection is required' });
        }

        const qty = Math.max(1, parseInt(quantity, 10) || 1);
        const type = ticket_type === 'Premium' ? 'Premium' : 'Standard';
        const unit_price = type === 'Premium' ? 18500.00 : 6500.00;
        const total_price = unit_price * qty;
        const email = (user_email || fan_email || 'fan@fifa.org').trim();
        const name = (user_name || fan_name || 'Alex Silva').trim();

        // Generate unique reference like FIFA-7482
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        const booking_ref = `FIFA-${randomDigits}`;

        const [insertResult] = await db.query(`
            INSERT INTO ticket_booking 
            (booking_ref, user_email, user_name, user_type, match_id, ticket_type, quantity, unit_price, total_price, status)
            VALUES (?, ?, ?, 'fan', ?, ?, ?, ?, ?, 'CONFIRMED')
        `, [booking_ref, email, name, match_id, type, qty, unit_price, total_price]);

        // Fetch complete record with match details
        const [bookingRows] = await db.query(`
            SELECT tb.*,
                tb.booking_ref AS booking_reference,
                tb.total_price AS total_amount,
                tb.unit_price AS price_per_ticket,
                tb.user_name AS fan_name,
                tb.user_email AS fan_email,
                ht.name AS home_team,
                at.name AS away_team,
                s.name AS stadium_name,
                s.city AS stadium_city,
                tr.name AS tournament_name,
                m.match_date,
                m.match_time,
                m.stage
            FROM ticket_booking tb
            INNER JOIN \`match\` m ON m.match_id = tb.match_id
            INNER JOIN team ht ON ht.team_id = m.home_team_id
            INNER JOIN team at ON at.team_id = m.away_team_id
            LEFT JOIN stadium s ON s.stadium_id = m.stadium_id
            LEFT JOIN tournament tr ON tr.tournament_id = m.tournament_id
            WHERE tb.booking_id = ?
        `, [insertResult.insertId]);

        res.status(201).json({
            success: true,
            message: 'Ticket booked successfully',
            data: bookingRows[0]
        });
    } catch (err) { next(err); }
};

exports.cancel = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('UPDATE ticket_booking SET status = "CANCELLED" WHERE booking_id = ?', [id]);
        if (!result.affectedRows) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        res.json({ success: true, message: 'Booking cancelled successfully' });
    } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM ticket_booking WHERE booking_id = ?', [id]);
        if (!result.affectedRows) {
            return res.status(404).json({ success: false, message: 'Booking record not found' });
        }
        res.json({ success: true, message: 'Booking record deleted permanently' });
    } catch (err) { next(err); }
};

