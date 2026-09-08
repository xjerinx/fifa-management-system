const db = require('../config/db');
const { bulkDelete } = require('../utils/bulkDelete');
const { bulkImport } = require('../utils/bulkImport');

exports.getAll = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT t.*,
                COALESCE(tt.team_count, 0) AS team_count,
                COALESCE(m.match_count, 0) AS match_count,
                COALESCE(ts.sponsor_count, 0) AS sponsor_count,
                COALESCE(ts.total_sponsorship_value, 0) AS total_sponsorship_value,
                COALESCE(ts.sponsor_names, '') AS sponsor_names
            FROM tournament t
            LEFT JOIN (
                SELECT tournament_id, COUNT(DISTINCT team_id) AS team_count
                FROM team_tournament
                GROUP BY tournament_id
            ) tt ON tt.tournament_id = t.tournament_id
            LEFT JOIN (
                SELECT tournament_id, COUNT(DISTINCT match_id) AS match_count
                FROM \`match\`
                GROUP BY tournament_id
            ) m ON m.tournament_id = t.tournament_id
            LEFT JOIN (
                SELECT ts.tournament_id,
                       COUNT(DISTINCT ts.sponsor_id) AS sponsor_count,
                       SUM(ts.contract_value) AS total_sponsorship_value,
                       GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ') AS sponsor_names
                FROM tournament_sponsor ts
                INNER JOIN sponsor s ON s.sponsor_id = ts.sponsor_id
                GROUP BY ts.tournament_id
            ) ts ON ts.tournament_id = t.tournament_id
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

exports.bulkRemove = async (req, res, next) => {
    try {
        const { ids } = req.body;
        const result = await bulkDelete({
            tableName: 'tournament',
            pkColumn: 'tournament_id',
            ids,
            entityLabel: 'tournament',
        });
        res.json({
            success: true,
            message: `Successfully deleted ${result.affectedRows} tournament(s)`,
            count: result.affectedRows,
        });
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

exports.getSponsors = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT ts.tournament_id, ts.sponsor_id, ts.term_cycle, ts.contract_value, ts.created_at,
                   s.name AS sponsor_name, s.industry, s.country
            FROM tournament_sponsor ts
            INNER JOIN sponsor s ON s.sponsor_id = ts.sponsor_id
            WHERE ts.tournament_id = ?
            ORDER BY ts.contract_value DESC, s.name ASC
        `, [req.params.id]);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};

exports.addSponsor = async (req, res, next) => {
    try {
        const { sponsor_id, term_cycle, contract_value } = req.body;
        if (!sponsor_id) {
            return res.status(400).json({ success: false, message: 'Sponsor is required' });
        }
        await db.query(`
            INSERT INTO tournament_sponsor (tournament_id, sponsor_id, term_cycle, contract_value)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                term_cycle = VALUES(term_cycle),
                contract_value = VALUES(contract_value)
        `, [
            req.params.id,
            sponsor_id,
            term_cycle || '2024–2026',
            contract_value !== undefined && contract_value !== '' ? Number(contract_value) : 5000000.00
        ]);
        res.json({ success: true, message: 'Sponsor assigned to tournament successfully' });
    } catch (err) { next(err); }
};

exports.updateSponsor = async (req, res, next) => {
    try {
        const { term_cycle, contract_value } = req.body;
        const [result] = await db.query(`
            UPDATE tournament_sponsor
            SET term_cycle = ?, contract_value = ?
            WHERE tournament_id = ? AND sponsor_id = ?
        `, [
            term_cycle || '2024–2026',
            contract_value !== undefined && contract_value !== '' ? Number(contract_value) : 0,
            req.params.id,
            req.params.sponsorId
        ]);
        if (!result.affectedRows) {
            return res.status(404).json({ success: false, message: 'Tournament sponsorship record not found' });
        }
        res.json({ success: true, message: 'Sponsorship contract updated successfully' });
    } catch (err) { next(err); }
};

exports.removeSponsor = async (req, res, next) => {
    try {
        const [result] = await db.query(
            'DELETE FROM tournament_sponsor WHERE tournament_id = ? AND sponsor_id = ?',
            [req.params.id, req.params.sponsorId]
        );
        if (!result.affectedRows) {
            return res.status(404).json({ success: false, message: 'Tournament sponsorship record not found' });
        }
        res.json({ success: true, message: 'Sponsor removed from tournament successfully' });
    } catch (err) { next(err); }
};

exports.bulkImport = async (req, res, next) => {
    try {
        const { rows } = req.body;
        const result = await bulkImport({
            tableName: 'tournament',
            columns: ['name', 'type', 'format', 'start_date', 'end_date'],
            rows,
        });
        res.json({
            success: true,
            message: `Successfully imported ${result.count} tournament(s)`,
            count: result.count,
        });
    } catch (err) { next(err); }
};