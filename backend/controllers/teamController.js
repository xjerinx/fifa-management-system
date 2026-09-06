const db = require('../config/db');

exports.getAll = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT t.*, a.name AS association_name,
                CONCAT(MAX(c.first_name), ' ', MAX(c.last_name)) AS coach_name,
                COUNT(p.player_id) AS player_count
            FROM team t
            LEFT JOIN association a ON a.association_id = t.association_id
            LEFT JOIN coach c ON c.team_id = t.team_id AND c.end_date IS NULL
            LEFT JOIN player p ON p.team_id = t.team_id
            GROUP BY t.team_id
            ORDER BY t.fifa_ranking ASC, t.name ASC
        `);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT t.*, a.name AS association_name
            FROM team t
            LEFT JOIN association a ON a.association_id = t.association_id
            WHERE t.team_id = ?
        `, [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Team not found' });
        res.json({ success: true, data: rows[0] });
    } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
    try {
        const { name, nickname, foundation_year, jersey_color, fifa_ranking, association_id } = req.body;
        if (!name || !jersey_color || !association_id)
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        
        const rankVal = fifa_ranking !== undefined && fifa_ranking !== '' ? parseInt(fifa_ranking, 10) : null;
        const foundYear = foundation_year !== undefined && foundation_year !== '' ? parseInt(foundation_year, 10) : 0;
        const [result] = await db.query(
            'INSERT INTO team (name, nickname, foundation_year, jersey_color, fifa_ranking, association_id) VALUES (?,?,?,?,?,?)',
            [name.trim(), nickname?.trim() || null, foundYear, jersey_color.trim(), rankVal, parseInt(association_id, 10)]
        );
        res.status(201).json({ success: true, data: { team_id: result.insertId, ...req.body } });
    } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
    try {
        const { name, nickname, foundation_year, jersey_color, fifa_ranking, association_id } = req.body;
        if (!name || !jersey_color || !association_id)
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        
        const rankVal = fifa_ranking !== undefined && fifa_ranking !== '' ? parseInt(fifa_ranking, 10) : null;
        const foundYear = foundation_year !== undefined && foundation_year !== '' ? parseInt(foundation_year, 10) : 0;
        const [result] = await db.query(
            'UPDATE team SET name=?, nickname=?, foundation_year=?, jersey_color=?, fifa_ranking=?, association_id=? WHERE team_id=?',
            [name.trim(), nickname?.trim() || null, foundYear, jersey_color.trim(), rankVal, parseInt(association_id, 10), req.params.id]
        );
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Team not found' });
        res.json({ success: true, message: 'Team updated successfully' });
    } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
    try {
        const [result] = await db.query('DELETE FROM team WHERE team_id = ?', [req.params.id]);
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Team not found' });
        res.json({ success: true, message: 'Team deleted successfully' });
    } catch (err) { next(err); }
};

exports.getPlayers = async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT * FROM player WHERE team_id = ? ORDER BY position', [req.params.id]);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};

exports.getTournaments = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT t.* FROM tournament t
            INNER JOIN team_tournament tt ON tt.tournament_id = t.tournament_id
            WHERE tt.team_id = ?
            ORDER BY t.start_date DESC
        `, [req.params.id]);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};