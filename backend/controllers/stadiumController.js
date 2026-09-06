const db = require('../config/db');

exports.getAll = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT s.*, COUNT(m.match_id) AS matches_hosted
            FROM stadium s
            LEFT JOIN \`match\` m ON m.stadium_id = s.stadium_id
            GROUP BY s.stadium_id
            ORDER BY s.name
        `);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM stadium WHERE stadium_id = ?',
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ success: false, message: 'Stadium not found' });
        res.json({ success: true, data: rows[0] });
    } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
    try {
        const { name, capacity, location, city, country } = req.body;
        if (!name || !capacity || !city || !country)
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        if (capacity <= 0)
            return res.status(400).json({ success: false, message: 'Capacity must be positive' });
        const [result] = await db.query(
            'INSERT INTO stadium (name, capacity, location, city, country) VALUES (?,?,?,?,?)',
            [name, capacity, location, city, country]
        );
        res.status(201).json({ success: true, data: { stadium_id: result.insertId, ...req.body } });
    } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
    try {
        const { name, capacity, location, city, country } = req.body;
        if (!name || !capacity || !city || !country)
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        if (capacity <= 0)
            return res.status(400).json({ success: false, message: 'Capacity must be positive' });
        const [result] = await db.query(
            'UPDATE stadium SET name=?, capacity=?, location=?, city=?, country=? WHERE stadium_id=?',
            [name, capacity, location, city, country, req.params.id]
        );
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Stadium not found' });
        res.json({ success: true, message: 'Stadium updated successfully' });
    } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
    try {
        const [result] = await db.query('DELETE FROM stadium WHERE stadium_id = ?', [req.params.id]);
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Stadium not found' });
        res.json({ success: true, message: 'Stadium deleted successfully' });
    } catch (err) { next(err); }
};