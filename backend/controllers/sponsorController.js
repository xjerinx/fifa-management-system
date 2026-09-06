const db = require('../config/db');

exports.getAll = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT s.*, COUNT(ms.match_id) AS matches_sponsored
            FROM sponsor s
            LEFT JOIN match_sponsor ms ON ms.sponsor_id = s.sponsor_id
            GROUP BY s.sponsor_id
            ORDER BY s.name
        `);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM sponsor WHERE sponsor_id = ?',
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ success: false, message: 'Sponsor not found' });
        res.json({ success: true, data: rows[0] });
    } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
    try {
        const { name, industry, country } = req.body;
        if (!name || !industry || !country)
            return res.status(400).json({ success: false, message: 'All fields are required' });
        const [result] = await db.query(
            'INSERT INTO sponsor (name, industry, country) VALUES (?,?,?)',
            [name, industry, country]
        );
        res.status(201).json({ success: true, data: { sponsor_id: result.insertId, ...req.body } });
    } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
    try {
        const { name, industry, country } = req.body;
        if (!name || !industry || !country)
            return res.status(400).json({ success: false, message: 'All fields are required' });
        const [result] = await db.query(
            'UPDATE sponsor SET name=?, industry=?, country=? WHERE sponsor_id=?',
            [name, industry, country, req.params.id]
        );
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Sponsor not found' });
        res.json({ success: true, message: 'Sponsor updated successfully' });
    } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
    try {
        const [result] = await db.query('DELETE FROM sponsor WHERE sponsor_id = ?', [req.params.id]);
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Sponsor not found' });
        res.json({ success: true, message: 'Sponsor deleted successfully' });
    } catch (err) { next(err); }
};

exports.getMatches = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT m.*, ht.name AS home_team, at.name AS away_team,
                tr.name AS tournament_name
            FROM \`match\` m
            INNER JOIN match_sponsor ms ON ms.match_id = m.match_id
            INNER JOIN team ht ON ht.team_id = m.home_team_id
            INNER JOIN team at ON at.team_id = m.away_team_id
            INNER JOIN tournament tr ON tr.tournament_id = m.tournament_id
            WHERE ms.sponsor_id = ?
            ORDER BY m.match_date DESC
        `, [req.params.id]);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};