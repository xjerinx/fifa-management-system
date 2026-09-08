const db = require('../config/db');
const { bulkDelete } = require('../utils/bulkDelete');
const { bulkImport } = require('../utils/bulkImport');

exports.getAll = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT s.*,
                COUNT(DISTINCT ts.tournament_id) AS tournaments_sponsored,
                COALESCE(SUM(ts.contract_value), 0) AS total_contract_value,
                GROUP_CONCAT(DISTINCT ts.term_cycle ORDER BY ts.term_cycle SEPARATOR ', ') AS term_cycles,
                GROUP_CONCAT(DISTINCT t.name ORDER BY t.tournament_id SEPARATOR ', ') AS tournament_names
            FROM sponsor s
            LEFT JOIN tournament_sponsor ts ON ts.sponsor_id = s.sponsor_id
            LEFT JOIN tournament t ON t.tournament_id = ts.tournament_id
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

exports.bulkRemove = async (req, res, next) => {
    try {
        const { ids } = req.body;
        const result = await bulkDelete({
            tableName: 'sponsor',
            pkColumn: 'sponsor_id',
            ids,
            entityLabel: 'sponsor',
        });
        res.json({
            success: true,
            message: `Successfully deleted ${result.affectedRows} sponsor(s)`,
            count: result.affectedRows,
        });
    } catch (err) { next(err); }
};

exports.getTournaments = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT t.*, ts.term_cycle, ts.contract_value, ts.created_at AS partnership_since
            FROM tournament t
            INNER JOIN tournament_sponsor ts ON ts.tournament_id = t.tournament_id
            WHERE ts.sponsor_id = ?
            ORDER BY t.start_date DESC
        `, [req.params.id]);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};

exports.addTournament = async (req, res, next) => {
    try {
        const { tournament_id, term_cycle, contract_value } = req.body;
        if (!tournament_id) {
            return res.status(400).json({ success: false, message: 'Tournament is required' });
        }
        await db.query(`
            INSERT INTO tournament_sponsor (tournament_id, sponsor_id, term_cycle, contract_value)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                term_cycle = VALUES(term_cycle),
                contract_value = VALUES(contract_value)
        `, [
            tournament_id,
            req.params.id,
            term_cycle || '2024–2026',
            contract_value !== undefined && contract_value !== '' ? Number(contract_value) : 5000000.00
        ]);
        res.json({ success: true, message: 'Tournament partnership assigned successfully' });
    } catch (err) { next(err); }
};

exports.updateTournament = async (req, res, next) => {
    try {
        const { term_cycle, contract_value } = req.body;
        const [result] = await db.query(`
            UPDATE tournament_sponsor
            SET term_cycle = ?, contract_value = ?
            WHERE sponsor_id = ? AND tournament_id = ?
        `, [
            term_cycle || '2024–2026',
            contract_value !== undefined && contract_value !== '' ? Number(contract_value) : 0,
            req.params.id,
            req.params.tournamentId
        ]);
        if (!result.affectedRows) {
            return res.status(404).json({ success: false, message: 'Tournament sponsorship record not found' });
        }
        res.json({ success: true, message: 'Partnership contract updated successfully' });
    } catch (err) { next(err); }
};

exports.removeTournament = async (req, res, next) => {
    try {
        const [result] = await db.query(
            'DELETE FROM tournament_sponsor WHERE sponsor_id = ? AND tournament_id = ?',
            [req.params.id, req.params.tournamentId]
        );
        if (!result.affectedRows) {
            return res.status(404).json({ success: false, message: 'Tournament sponsorship record not found' });
        }
        res.json({ success: true, message: 'Tournament partnership removed successfully' });
    } catch (err) { next(err); }
};

exports.bulkImport = async (req, res, next) => {
    try {
        const { rows } = req.body;
        const result = await bulkImport({
            tableName: 'sponsor',
            columns: ['name', 'industry', 'country'],
            rows,
        });
        res.json({
            success: true,
            message: `Successfully imported ${result.count} sponsor(s)`,
            count: result.count,
        });
    } catch (err) { next(err); }
};