const db = require('../config/db');
const { bulkDelete } = require('../utils/bulkDelete');
const { bulkImport } = require('../utils/bulkImport');

exports.getAll = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT c.*, t.name AS team_name
            FROM coach c
            LEFT JOIN team t ON t.team_id = c.team_id
            ORDER BY c.last_name
        `);
        res.json({ success: true, data: rows });
    } catch (err) {
        next(err);
    }
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

        const cleanTeamId = team_id !== undefined && team_id !== null && team_id !== '' ? parseInt(team_id, 10) : null;
        if (cleanTeamId) {
            const [teamRows] = await db.query('SELECT team_id FROM team WHERE team_id = ?', [cleanTeamId]);
            if (!teamRows.length) {
                return res.status(400).json({ success: false, message: 'Selected team does not exist' });
            }
            await db.query('UPDATE coach SET team_id = NULL WHERE team_id = ?', [cleanTeamId]);
        }

        const [result] = await db.query(
            'INSERT INTO coach (first_name, last_name, dob, nationality, license_no, start_date, end_date, team_id) VALUES (?,?,?,?,?,?,?,?)',
            [first_name.trim(), last_name.trim(), dob, nationality.trim(), license_no.trim(), start_date, end_date || null, cleanTeamId]
        );
        res.status(201).json({ success: true, data: { coach_id: result.insertId, ...req.body, team_id: cleanTeamId } });
    } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
    try {
        const { first_name, last_name, dob, nationality, license_no, start_date, end_date, team_id } = req.body;
        if (!first_name || !last_name || !dob || !nationality || !license_no || !start_date)
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        if (end_date && end_date <= start_date)
            return res.status(400).json({ success: false, message: 'End date must be after start date' });

        const coachId = parseInt(req.params.id, 10);
        const cleanTeamId = team_id !== undefined && team_id !== null && team_id !== '' ? parseInt(team_id, 10) : null;
        if (cleanTeamId) {
            const [teamRows] = await db.query('SELECT team_id FROM team WHERE team_id = ?', [cleanTeamId]);
            if (!teamRows.length) {
                return res.status(400).json({ success: false, message: 'Selected team does not exist' });
            }
            await db.query('UPDATE coach SET team_id = NULL WHERE team_id = ? AND coach_id != ?', [cleanTeamId, coachId]);
        }

        const [result] = await db.query(
            'UPDATE coach SET first_name=?, last_name=?, dob=?, nationality=?, license_no=?, start_date=?, end_date=?, team_id=? WHERE coach_id=?',
            [first_name.trim(), last_name.trim(), dob, nationality.trim(), license_no.trim(), start_date, end_date || null, cleanTeamId, coachId]
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

exports.bulkRemove = async (req, res, next) => {
    try {
        const { ids } = req.body;
        const result = await bulkDelete({
            tableName: 'coach',
            pkColumn: 'coach_id',
            ids,
            entityLabel: 'coach',
        });
        res.json({
            success: true,
            message: `Successfully deleted ${result.affectedRows} coach(es)`,
            count: result.affectedRows,
        });
    } catch (err) { next(err); }
};

exports.bulkImport = async (req, res, next) => {
    try {
        const { rows } = req.body;
        const result = await bulkImport({
            tableName: 'coach',
            columns: ['first_name', 'last_name', 'dob', 'nationality', 'license_no', 'start_date', 'end_date', 'team_id'],
            rows,
            transformRow: (row) => ({
                ...row,
                team_id: row.team_id ? parseInt(row.team_id, 10) : null,
            }),
        });
        res.json({
            success: true,
            message: `Successfully imported ${result.count} coach(es)`,
            count: result.count,
        });
    } catch (err) { next(err); }
};