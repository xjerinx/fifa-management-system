const db = require('../config/db');
const { bulkDelete } = require('../utils/bulkDelete');
const { bulkImport } = require('../utils/bulkImport');

exports.getAll = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT r.*, COUNT(mr.match_id) AS matches_officiated
            FROM referee r
            LEFT JOIN match_referee mr ON mr.referee_id = r.referee_id
            GROUP BY r.referee_id
            ORDER BY r.last_name
        `);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM referee WHERE referee_id = ?',
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ success: false, message: 'Referee not found' });
        res.json({ success: true, data: rows[0] });
    } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
    try {
        const { first_name, last_name, nationality, badge_no, role } = req.body;
        if (!first_name || !last_name || !nationality || !badge_no || !role)
            return res.status(400).json({ success: false, message: 'All fields are required' });
        const [result] = await db.query(
            'INSERT INTO referee (first_name, last_name, nationality, badge_no, role) VALUES (?,?,?,?,?)',
            [first_name, last_name, nationality, badge_no, role]
        );
        res.status(201).json({ success: true, data: { referee_id: result.insertId, ...req.body } });
    } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
    try {
        const { first_name, last_name, nationality, badge_no, role } = req.body;
        if (!first_name || !last_name || !nationality || !badge_no || !role)
            return res.status(400).json({ success: false, message: 'All fields are required' });
        const [result] = await db.query(
            'UPDATE referee SET first_name=?, last_name=?, nationality=?, badge_no=?, role=? WHERE referee_id=?',
            [first_name, last_name, nationality, badge_no, role, req.params.id]
        );
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Referee not found' });
        res.json({ success: true, message: 'Referee updated successfully' });
    } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
    try {
        const [result] = await db.query('DELETE FROM referee WHERE referee_id = ?', [req.params.id]);
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Referee not found' });
        res.json({ success: true, message: 'Referee deleted successfully' });
    } catch (err) { next(err); }
};

exports.bulkRemove = async (req, res, next) => {
    try {
        const { ids } = req.body;
        const result = await bulkDelete({
            tableName: 'referee',
            pkColumn: 'referee_id',
            ids,
            entityLabel: 'referee',
        });
        res.json({
            success: true,
            message: `Successfully deleted ${result.affectedRows} referee(s)`,
            count: result.affectedRows,
        });
    } catch (err) { next(err); }
};

exports.bulkImport = async (req, res, next) => {
    try {
        const { rows } = req.body;
        const result = await bulkImport({
            tableName: 'referee',
            columns: ['first_name', 'last_name', 'nationality', 'badge_no', 'role'],
            rows,
        });
        res.json({
            success: true,
            message: `Successfully imported ${result.count} referee(s)`,
            count: result.count,
        });
    } catch (err) { next(err); }
};