const db = require('../config/db');

exports.getAll = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT t.*,
                COUNT(DISTINCT tt.team_id) AS team_count,
                COUNT(DISTINCT m.match_id) AS match_count
            FROM tournament t
            LEFT JOIN team_tournament tt ON tt.tournament_id = t.tournament_id
            LEFT JOIN \`match\` m ON m.tournament_id = t.tournament_id
            GROUP BY t.tournament_id
            ORDER BY t.start_date DESC
        `);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM tournament WHERE tournament_id = ?',
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ success: false, message: 'Tournament not found' });
        res.json({ success: true, data: rows[0] });
    } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
    try {
        const { name, type, format, start_date, end_date } = req.body;
        if (!name || !type || !format || !start_date || !end_date)
            return res.status(400).json({ success: false, message: 'All fields are required' });
        if (end_date <= start_date)
            return res.status(400).json({ success: false, message: 'End date must be after start date' });
        const [result] = await db.query(
            'INSERT INTO tournament (name, type, format, start_date, end_date) VALUES (?,?,?,?,?)',
            [name, type, format, start_date, end_date]
        );
        res.status(201).json({ success: true, data: { tournament_id: result.insertId, ...req.body } });
    } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
    try {
        const { name, type, format, start_date, end_date } = req.body;
        if (!name || !type || !format || !start_date || !end_date)
            return res.status(400).json({ success: false, message: 'All fields are required' });
        if (end_date <= start_date)
            return res.status(400).json({ success: false, message: 'End date must be after start date' });
        const [result] = await db.query(
            'UPDATE tournament SET name=?, type=?, format=?, start_date=?, end_date=? WHERE tournament_id=?',
            [name, type, format, start_date, end_date, req.params.id]
        );
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Tournament not found' });
        res.json({ success: true, message: 'Tournament updated successfully' });
    } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
    try {
        const [result] = await db.query('DELETE FROM tournament WHERE tournament_id = ?', [req.params.id]);
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Tournament not found' });
        res.json({ success: true, message: 'Tournament deleted successfully' });
    } catch (err) { next(err); }
};

exports.getTeams = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT t.*, a.name AS association_name
            FROM team t
            INNER JOIN team_tournament tt ON tt.team_id = t.team_id
            LEFT JOIN association a ON a.association_id = t.association_id
            WHERE tt.tournament_id = ?
            ORDER BY t.fifa_ranking
        `, [req.params.id]);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};

exports.getMatches = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT m.*, 
                ht.name AS home_team, at.name AS away_team,
                s.name AS stadium_name
            FROM \`match\` m
            INNER JOIN team ht ON ht.team_id = m.home_team_id
            INNER JOIN team at ON at.team_id = m.away_team_id
            INNER JOIN stadium s ON s.stadium_id = m.stadium_id
            WHERE m.tournament_id = ?
            ORDER BY m.match_date
        `, [req.params.id]);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};

exports.addTeam = async (req, res, next) => {
    try {
        const { team_id } = req.body;
        await db.query(
            'INSERT IGNORE INTO team_tournament (team_id, tournament_id) VALUES (?,?)',
            [team_id, req.params.id]
        );
        res.json({ success: true, message: 'Team added to tournament' });
    } catch (err) { next(err); }
};

exports.removeTeam = async (req, res, next) => {
    try {
        await db.query(
            'DELETE FROM team_tournament WHERE team_id=? AND tournament_id=?',
            [req.params.teamId, req.params.id]
        );
        res.json({ success: true, message: 'Team removed from tournament' });
    } catch (err) { next(err); }
};