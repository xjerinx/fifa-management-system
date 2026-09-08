const db = require('../config/db');
const { bulkDelete } = require('../utils/bulkDelete');
const { bulkImport } = require('../utils/bulkImport');

exports.getAll = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT a.*, COUNT(t.team_id) AS team_count
            FROM association a
            LEFT JOIN team t ON t.association_id = a.association_id
            GROUP BY a.association_id
            ORDER BY a.name
        `);
        res.json({ success: true, data: rows });
    } catch (err) {
        next(err);
    }
};

exports.getOne = async (req, res, next) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM association WHERE association_id = ?',
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ success: false, message: 'Association not found' });
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
};

exports.create = async (req, res, next) => {
    try {
        const { name, region, fifa_code, foundation_date } = req.body;
        if (!name || !region || !fifa_code || !foundation_date)
            return res.status(400).json({ success: false, message: 'All fields are required' });
        const [result] = await db.query(
            'INSERT INTO association (name, region, fifa_code, foundation_date) VALUES (?, ?, ?, ?)',
            [name, region, fifa_code, foundation_date]
        );
        res.status(201).json({ success: true, data: { association_id: result.insertId, ...req.body } });
    } catch (err) {
        next(err);
    }
};

exports.update = async (req, res, next) => {
    try {
        const { name, region, fifa_code, foundation_date } = req.body;
        if (!name || !region || !fifa_code || !foundation_date)
            return res.status(400).json({ success: false, message: 'All fields are required' });
        const [result] = await db.query(
            'UPDATE association SET name=?, region=?, fifa_code=?, foundation_date=? WHERE association_id=?',
            [name, region, fifa_code, foundation_date, req.params.id]
        );
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Association not found' });
        res.json({ success: true, message: 'Association updated successfully' });
    } catch (err) {
        next(err);
    }
};

exports.remove = async (req, res, next) => {
    try {
        const [result] = await db.query(
            'DELETE FROM association WHERE association_id = ?',
            [req.params.id]
        );
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Association not found' });
        res.json({ success: true, message: 'Association deleted successfully' });
    } catch (err) {
        next(err);
    }
};

exports.bulkRemove = async (req, res, next) => {
    try {
        const { ids } = req.body;
        const result = await bulkDelete({
            tableName: 'association',
            pkColumn: 'association_id',
            ids,
            entityLabel: 'association',
        });
        res.json({
            success: true,
            message: `Successfully deleted ${result.affectedRows} association(s)`,
            count: result.affectedRows,
        });
    } catch (err) {
        next(err);
    }
};

exports.getTeams = async (req, res, next) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM team WHERE association_id = ? ORDER BY fifa_ranking',
            [req.params.id]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        next(err);
    }
};

exports.bulkImport = async (req, res, next) => {
    try {
        const { rows } = req.body;
        const result = await bulkImport({
            tableName: 'association',
            columns: ['name', 'region', 'fifa_code', 'foundation_date'],
            rows,
        });
        res.json({
            success: true,
            message: `Successfully imported ${result.count} association(s)`,
            count: result.count,
        });
    } catch (err) { next(err); }
};