const db = require('../config/db');

exports.getAll = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT c.*, t.name AS team_name
            FROM coach c
            LEFT JOIN team t ON t.team_id = c.team_id
            ORDER BY c.last_name
        `);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT c.*, t.name AS team_name
            FROM coach c
            LEFT JOIN team t ON t.team_id = c.team_id
            WHERE c.coach_id = ?
        `, [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Coach not found' });
        res.json({ success: true, data: rows[0] });
    } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
    try {
        const { first_name, last_name, dob, nationality, license_no, start_date, end_date, team_id } = req.body;
        if (!first_name || !last_name || !dob || !nationality || !license_no || !start_date)
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        if (end_date && end_date <= start_date)
            return res.status(400).json({ success: false, message: 'End date must be after start date' });
        const [result] = await db.query(
            'INSERT INTO coach (first_name, last_name, dob, nationality, license_no, start_date, end_date, team_id) VALUES (?,?,?,?,?,?,?,?)',
            [first_name, last_name, dob, nationality, license_no, start_date, end_date || null, team_id || null]
        );
        res.status(201).json({ success: true, data: { coach_id: result.insertId, ...req.body } });
    } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
    try {
        const { first_name, last_name, dob, nationality, license_no, start_date, end_date, team_id } = req.body;
        if (!first_name || !last_name || !dob || !nationality || !license_no || !start_date)
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        if (end_date && end_date <= start_date)
            return res.status(400).json({ success: false, message: 'End date must be after start date' });
        const [result] = await db.query(
            'UPDATE coach SET first_name=?, last_name=?, dob=?, nationality=?, license_no=?, start_date=?, end_date=?, team_id=? WHERE coach_id=?',
            [first_name, last_name, dob, nationality, license_no, start_date, end_date || null, team_id || null, req.params.id]
        );
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Coach not found' });
        res.json({ success: true, message: 'Coach updated successfully' });
    } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
    try {
        const [result] = await db.query('DELETE FROM coach WHERE coach_id = ?', [req.params.id]);
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Coach not found' });
        res.json({ success: true, message: 'Coach deleted successfully' });
    } catch (err) { next(err); }
};