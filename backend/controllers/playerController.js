const db = require('../config/db');

exports.getAll = async (req, res, next) => {
    try {
        const { team_id, nationality, position, foot } = req.query;
        let query = `
            SELECT p.*, t.name AS team_name, a.name AS association_name
            FROM player p
            LEFT JOIN team t ON t.team_id = p.team_id
            LEFT JOIN association a ON a.association_id = t.association_id
            WHERE 1=1
        `;
        const params = [];
        if (team_id) { query += ' AND p.team_id = ?'; params.push(team_id); }
        if (nationality) { query += ' AND p.nationality LIKE ?'; params.push(`%${nationality}%`); }
        if (position) { query += ' AND p.position = ?'; params.push(position); }
        if (foot) { query += ' AND p.preferred_foot = ?'; params.push(foot); }
        query += ' ORDER BY p.market_value_m DESC';
        const [rows] = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT p.*, t.name AS team_name
            FROM player p
            LEFT JOIN team t ON t.team_id = p.team_id
            WHERE p.player_id = ?
        `, [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Player not found' });
        res.json({ success: true, data: rows[0] });
    } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
    try {
        const { first_name, last_name, dob, nationality, position, height_cm, preferred_foot, market_value_m, jersey_number, team_id } = req.body;
        if (!first_name || !last_name || !dob || !nationality || !position || !height_cm || !jersey_number || !team_id)
            return res.status(400).json({ success: false, message: 'Required fields missing' });

        const jerseyNum = parseInt(jersey_number, 10);
        const height = parseInt(height_cm, 10);
        const marketVal = (market_value_m !== undefined && market_value_m !== '') ? parseFloat(market_value_m) : 0;
        const teamId = parseInt(team_id, 10);

        if (isNaN(jerseyNum) || jerseyNum < 1 || jerseyNum > 99)
            return res.status(400).json({ success: false, message: 'Jersey number must be between 1 and 99' });
        if (isNaN(height) || height < 100 || height > 250)
            return res.status(400).json({ success: false, message: 'Height must be between 100 and 250 cm' });
        if (isNaN(marketVal) || marketVal < 0)
            return res.status(400).json({ success: false, message: 'Market value cannot be negative' });

        const [result] = await db.query(
            'INSERT INTO player (first_name, last_name, dob, nationality, position, height_cm, preferred_foot, market_value_m, jersey_number, team_id) VALUES (?,?,?,?,?,?,?,?,?,?)',
            [first_name.trim(), last_name.trim(), dob, nationality.trim(), position.trim(), height, preferred_foot || 'Right', marketVal, jerseyNum, teamId]
        );
        res.status(201).json({ success: true, data: { player_id: result.insertId, ...req.body } });
    } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
    try {
        const { first_name, last_name, dob, nationality, position, height_cm, preferred_foot, market_value_m, jersey_number, team_id } = req.body;
        if (!first_name || !last_name || !dob || !nationality || !position || !height_cm || !jersey_number || !team_id)
            return res.status(400).json({ success: false, message: 'Required fields missing' });

        const jerseyNum = parseInt(jersey_number, 10);
        const height = parseInt(height_cm, 10);
        const marketVal = (market_value_m !== undefined && market_value_m !== '') ? parseFloat(market_value_m) : 0;
        const teamId = parseInt(team_id, 10);

        if (isNaN(jerseyNum) || jerseyNum < 1 || jerseyNum > 99)
            return res.status(400).json({ success: false, message: 'Jersey number must be between 1 and 99' });
        if (isNaN(height) || height < 100 || height > 250)
            return res.status(400).json({ success: false, message: 'Height must be between 100 and 250 cm' });
        if (isNaN(marketVal) || marketVal < 0)
            return res.status(400).json({ success: false, message: 'Market value cannot be negative' });

        const [result] = await db.query(
            'UPDATE player SET first_name=?, last_name=?, dob=?, nationality=?, position=?, height_cm=?, preferred_foot=?, market_value_m=?, jersey_number=?, team_id=? WHERE player_id=?',
            [first_name.trim(), last_name.trim(), dob, nationality.trim(), position.trim(), height, preferred_foot || 'Right', marketVal, jerseyNum, teamId, req.params.id]
        );
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Player not found' });
        res.json({ success: true, message: 'Player updated successfully' });
    } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
    try {
        const [result] = await db.query('DELETE FROM player WHERE player_id = ?', [req.params.id]);
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Player not found' });
        res.json({ success: true, message: 'Player deleted successfully' });
    } catch (err) { next(err); }
};