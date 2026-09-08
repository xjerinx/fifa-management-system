const db = require('../config/db');
const { bulkDelete } = require('../utils/bulkDelete');

exports.getAll = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT me.*, 
                CONCAT(p.first_name, ' ', p.last_name) AS player_name,
                t.name AS team_name,
                ht.name AS home_team, at.name AS away_team
            FROM match_event me
            LEFT JOIN player p ON p.player_id = me.player_id
            LEFT JOIN team t ON t.team_id = p.team_id
            INNER JOIN \`match\` m ON m.match_id = me.match_id
            INNER JOIN team ht ON ht.team_id = m.home_team_id
            INNER JOIN team at ON at.team_id = m.away_team_id
            ORDER BY me.match_id, me.minute ASC
        `);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM match_event WHERE event_id = ?',
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ success: false, message: 'Event not found' });
        res.json({ success: true, data: rows[0] });
    } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
    try {
        const { match_id, event_type, minute, player_id, description } = req.body;
        if (!match_id || !event_type || minute === undefined || minute === '')
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        const minVal = parseInt(minute, 10);
        if (isNaN(minVal) || minVal < 1 || minVal > 120)
            return res.status(400).json({ success: false, message: 'Minute must be between 1 and 120' });
        const [result] = await db.query(
            'INSERT INTO match_event (match_id, event_type, minute, player_id, description) VALUES (?,?,?,?,?)',
            [parseInt(match_id, 10), event_type.trim(), minVal, player_id ? parseInt(player_id, 10) : null, description?.trim() || null]
        );
        res.status(201).json({ success: true, data: { event_id: result.insertId, ...req.body } });
    } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
    try {
        const { match_id, event_type, minute, player_id, description } = req.body;
        if (!event_type || minute === undefined || minute === '')
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        const minVal = parseInt(minute, 10);
        if (isNaN(minVal) || minVal < 1 || minVal > 120)
            return res.status(400).json({ success: false, message: 'Minute must be between 1 and 120' });

        let query, params;
        if (match_id) {
            query = 'UPDATE match_event SET match_id=?, event_type=?, minute=?, player_id=?, description=? WHERE event_id=?';
            params = [parseInt(match_id, 10), event_type.trim(), minVal, player_id ? parseInt(player_id, 10) : null, description?.trim() || null, req.params.id];
        } else {
            query = 'UPDATE match_event SET event_type=?, minute=?, player_id=?, description=? WHERE event_id=?';
            params = [event_type.trim(), minVal, player_id ? parseInt(player_id, 10) : null, description?.trim() || null, req.params.id];
        }
        const [result] = await db.query(query, params);
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Event not found' });
        res.json({ success: true, message: 'Event updated successfully' });
    } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
    try {
        const [result] = await db.query('DELETE FROM match_event WHERE event_id = ?', [req.params.id]);
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Event not found' });
        res.json({ success: true, message: 'Event deleted successfully' });
    } catch (err) { next(err); }
};

exports.bulkRemove = async (req, res, next) => {
    try {
        const { ids } = req.body;
        const result = await bulkDelete({
            tableName: 'match_event',
            pkColumn: 'event_id',
            ids,
            entityLabel: 'match event',
        });
        res.json({
            success: true,
            message: `Successfully deleted ${result.affectedRows} match event(s)`,
            count: result.affectedRows,
        });
    } catch (err) { next(err); }
};