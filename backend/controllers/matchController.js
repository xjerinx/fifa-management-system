const db = require('../config/db');
const { bulkDelete } = require('../utils/bulkDelete');
const { bulkImport } = require('../utils/bulkImport');
const { ensureMatchRefereesTable } = require('../utils/matchRefereesHelper');

async function validateAndNormalizeReferees(referees) {
    if (!referees || !Array.isArray(referees) || referees.length === 0) {
        return [];
    }
    const cleanList = [];
    const seenIds = new Set();
    let mainRefereeCount = 0;
    let fourthOfficialCount = 0;

    for (const item of referees) {
        const refId = parseInt(item.referee_id || item.id, 10);
        if (isNaN(refId)) continue;
        if (seenIds.has(refId)) {
            const err = new Error('A referee cannot be assigned twice to the same match.');
            err.statusCode = 400;
            throw err;
        }
        seenIds.add(refId);

        const role = (item.role || item.match_role || 'Main Referee').trim();
        if (role === 'Main Referee') {
            mainRefereeCount++;
            if (mainRefereeCount > 1) {
                const err = new Error('A match can only have one Main Referee.');
                err.statusCode = 400;
                throw err;
            }
        }
        if (role === 'Fourth Official') {
            fourthOfficialCount++;
            if (fourthOfficialCount > 1) {
                const err = new Error('A match can only have one Fourth Official.');
                err.statusCode = 400;
                throw err;
            }
        }

        cleanList.push({ referee_id: refId, role });
    }

    if (cleanList.length > 0) {
        // Verify all referees actually exist in the database
        const refIds = cleanList.map(c => c.referee_id);
        const [existing] = await db.query(
            `SELECT referee_id FROM referee WHERE referee_id IN (?)`,
            [refIds]
        );
        if (existing.length !== refIds.length) {
            const err = new Error('One or more selected referees do not exist in the database.');
            err.statusCode = 400;
            throw err;
        }
    }

    return cleanList;
}

exports.getAll = async (req, res, next) => {
    try {
        await ensureMatchRefereesTable(db);
        const { upcoming } = req.query;
        let whereClause = '';
        let orderClause = 'ORDER BY m.match_date DESC, m.match_time DESC';

        if (upcoming === 'true' || upcoming === '1') {
            whereClause = 'WHERE TIMESTAMP(m.match_date, m.match_time) >= NOW() AND (m.result IS NULL OR TRIM(m.result) = "")';
            orderClause = 'ORDER BY TIMESTAMP(m.match_date, m.match_time) ASC';
        }

        const [rows] = await db.query(`
            SELECT m.*,
                ht.name AS home_team, at.name AS away_team,
                s.name AS stadium_name, s.city AS stadium_city,
                tr.name AS tournament_name
            FROM \`match\` m
            INNER JOIN team ht ON ht.team_id = m.home_team_id
            INNER JOIN team at ON at.team_id = m.away_team_id
            INNER JOIN stadium s ON s.stadium_id = m.stadium_id
            INNER JOIN tournament tr ON tr.tournament_id = m.tournament_id
            ${whereClause}
            ${orderClause}
        `);

        if (rows.length > 0) {
            try {
                const matchIds = rows.map(r => r.match_id);
                const [refRows] = await db.query(`
                    SELECT mr.match_id, mr.role AS match_role, mr.role,
                           r.referee_id, r.first_name, r.last_name, r.nationality, r.badge_no
                    FROM match_referees mr
                    INNER JOIN referee r ON r.referee_id = mr.referee_id
                    WHERE mr.match_id IN (?)
                    ORDER BY CASE mr.role
                        WHEN 'Main Referee' THEN 1
                        WHEN 'Assistant Referee' THEN 2
                        WHEN 'Fourth Official' THEN 3
                        WHEN 'VAR Official' THEN 4
                        ELSE 5 END, r.last_name ASC
                `, [matchIds]);

                const refsByMatch = {};
                for (const ref of refRows) {
                    if (!refsByMatch[ref.match_id]) refsByMatch[ref.match_id] = [];
                    refsByMatch[ref.match_id].push(ref);
                }
                for (const row of rows) {
                    row.referees = refsByMatch[row.match_id] || [];
                }
            } catch (refErr) {
                console.warn('[matchController.getAll] Warning loading match referees:', refErr.message);
                for (const row of rows) {
                    row.referees = [];
                }
            }
        }

        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
    try {
        await ensureMatchRefereesTable(db);
        const [rows] = await db.query(`
            SELECT m.*,
                ht.name AS home_team, at.name AS away_team,
                s.name AS stadium_name, s.city AS stadium_city,
                tr.name AS tournament_name
            FROM \`match\` m
            INNER JOIN team ht ON ht.team_id = m.home_team_id
            INNER JOIN team at ON at.team_id = m.away_team_id
            INNER JOIN stadium s ON s.stadium_id = m.stadium_id
            INNER JOIN tournament tr ON tr.tournament_id = m.tournament_id
            WHERE m.match_id = ?
        `, [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Match not found' });

        let refRows = [];
        try {
            const [data] = await db.query(`
                SELECT mr.match_id, mr.role AS match_role, mr.role,
                       r.referee_id, r.first_name, r.last_name, r.nationality, r.badge_no
                FROM match_referees mr
                INNER JOIN referee r ON r.referee_id = mr.referee_id
                WHERE mr.match_id = ?
                ORDER BY CASE mr.role
                    WHEN 'Main Referee' THEN 1
                    WHEN 'Assistant Referee' THEN 2
                    WHEN 'Fourth Official' THEN 3
                    WHEN 'VAR Official' THEN 4
                    ELSE 5 END, r.last_name ASC
            `, [req.params.id]);
            refRows = data;
        } catch (refErr) {
            console.warn('[matchController.getOne] Warning loading match referees:', refErr.message);
        }

        const match = rows[0];
        match.referees = refRows;
        res.json({ success: true, data: match });
    } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
    try {
        await ensureMatchRefereesTable(db);
        const { tournament_id, stadium_id, home_team_id, away_team_id, match_date, match_time, stage, result, referees } = req.body;
        if (!tournament_id || !stadium_id || !home_team_id || !away_team_id || !match_date || !match_time || !stage)
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        if (Number(home_team_id) === Number(away_team_id))
            return res.status(400).json({ success: false, message: 'Home and away teams must be different' });

        const validatedRefs = await validateAndNormalizeReferees(referees);

        const resVal = result && result.trim() ? result.trim() : null;
        const [r] = await db.query(
            'INSERT INTO `match` (tournament_id, stadium_id, home_team_id, away_team_id, match_date, match_time, stage, result) VALUES (?,?,?,?,?,?,?,?)',
            [parseInt(tournament_id, 10), parseInt(stadium_id, 10), parseInt(home_team_id, 10), parseInt(away_team_id, 10), match_date, match_time, stage.trim(), resVal]
        );
        const matchId = r.insertId;

        if (validatedRefs.length > 0) {
            const insertValues = validatedRefs.map(v => [matchId, v.referee_id, v.role]);
            await db.query(
                'INSERT INTO match_referees (match_id, referee_id, role) VALUES ?',
                [insertValues]
            );
        }

        res.status(201).json({
            success: true,
            data: { match_id: matchId, ...req.body, referees: validatedRefs }
        });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({ success: false, message: err.message });
        }
        next(err);
    }
};

exports.update = async (req, res, next) => {
    try {
        await ensureMatchRefereesTable(db);
        const { tournament_id, stadium_id, home_team_id, away_team_id, match_date, match_time, stage, result, referees } = req.body;
        if (!tournament_id || !stadium_id || !home_team_id || !away_team_id || !match_date || !match_time || !stage)
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        if (Number(home_team_id) === Number(away_team_id))
            return res.status(400).json({ success: false, message: 'Home and away teams must be different' });

        const resVal = result && result.trim() ? result.trim() : null;
        const [r] = await db.query(
            'UPDATE `match` SET tournament_id=?, stadium_id=?, home_team_id=?, away_team_id=?, match_date=?, match_time=?, stage=?, result=? WHERE match_id=?',
            [parseInt(tournament_id, 10), parseInt(stadium_id, 10), parseInt(home_team_id, 10), parseInt(away_team_id, 10), match_date, match_time, stage.trim(), resVal, req.params.id]
        );
        if (!r.affectedRows) return res.status(404).json({ success: false, message: 'Match not found' });

        // If referees field is provided in the update payload, synchronize match_referees
        if (referees !== undefined && Array.isArray(referees)) {
            const validatedRefs = await validateAndNormalizeReferees(referees);
            // Remove previous assignments for this match (only junction records, referee records remain untouched)
            await db.query('DELETE FROM match_referees WHERE match_id = ?', [req.params.id]);

            if (validatedRefs.length > 0) {
                const insertValues = validatedRefs.map(v => [req.params.id, v.referee_id, v.role]);
                await db.query(
                    'INSERT INTO match_referees (match_id, referee_id, role) VALUES ?',
                    [insertValues]
                );
            }
        }

        res.json({ success: true, message: 'Match updated successfully' });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({ success: false, message: err.message });
        }
        next(err);
    }
};

exports.remove = async (req, res, next) => {
    try {
        const [r] = await db.query('DELETE FROM `match` WHERE match_id = ?', [req.params.id]);
        if (!r.affectedRows) return res.status(404).json({ success: false, message: 'Match not found' });
        res.json({ success: true, message: 'Match deleted successfully' });
    } catch (err) { next(err); }
};

exports.bulkRemove = async (req, res, next) => {
    try {
        const { ids } = req.body;
        const result = await bulkDelete({
            tableName: 'match',
            pkColumn: 'match_id',
            ids,
            entityLabel: 'match',
        });
        res.json({
            success: true,
            message: `Successfully deleted ${result.affectedRows} match(es)`,
            count: result.affectedRows,
        });
    } catch (err) { next(err); }
};

exports.getEvents = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT me.*, CONCAT(p.first_name, ' ', p.last_name) AS player_name
            FROM match_event me
            LEFT JOIN player p ON p.player_id = me.player_id
            WHERE me.match_id = ?
            ORDER BY me.minute ASC
        `, [req.params.id]);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};

exports.getReferees = async (req, res, next) => {
    try {
        await ensureMatchRefereesTable(db);
        let rows = [];
        try {
            const [data] = await db.query(`
                SELECT r.*, mr.role AS match_role, mr.role
                FROM referee r
                INNER JOIN match_referees mr ON mr.referee_id = r.referee_id
                WHERE mr.match_id = ?
                ORDER BY CASE mr.role
                    WHEN 'Main Referee' THEN 1
                    WHEN 'Assistant Referee' THEN 2
                    WHEN 'Fourth Official' THEN 3
                    WHEN 'VAR Official' THEN 4
                    ELSE 5 END, r.last_name ASC
            `, [req.params.id]);
            rows = data;
        } catch (refErr) {
            console.warn('[matchController.getReferees] Warning loading match referees:', refErr.message);
            rows = [];
        }
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};

exports.addReferee = async (req, res, next) => {
    try {
        await ensureMatchRefereesTable(db);
        const { referee_id, role } = req.body;
        if (!referee_id) return res.status(400).json({ success: false, message: 'referee_id is required' });

        const [existingRef] = await db.query('SELECT referee_id FROM referee WHERE referee_id = ?', [referee_id]);
        if (!existingRef.length) return res.status(404).json({ success: false, message: 'Referee not found' });

        const refRole = (role || 'Main Referee').trim();
        if (refRole === 'Main Referee') {
            const [mainRef] = await db.query('SELECT referee_id FROM match_referees WHERE match_id = ? AND role = "Main Referee" AND referee_id != ?', [req.params.id, referee_id]);
            if (mainRef.length) return res.status(400).json({ success: false, message: 'A match can only have one Main Referee' });
        }
        if (refRole === 'Fourth Official') {
            const [fourthRef] = await db.query('SELECT referee_id FROM match_referees WHERE match_id = ? AND role = "Fourth Official" AND referee_id != ?', [req.params.id, referee_id]);
            if (fourthRef.length) return res.status(400).json({ success: false, message: 'A match can only have one Fourth Official' });
        }

        await db.query(
            'INSERT INTO match_referees (match_id, referee_id, role) VALUES (?,?,?) ON DUPLICATE KEY UPDATE role = VALUES(role)',
            [req.params.id, referee_id, refRole]
        );
        res.json({ success: true, message: 'Referee assigned to match' });
    } catch (err) { next(err); }
};

exports.removeReferee = async (req, res, next) => {
    try {
        await ensureMatchRefereesTable(db);
        await db.query(
            'DELETE FROM match_referees WHERE match_id=? AND referee_id=?',
            [req.params.id, req.params.refereeId]
        );
        res.json({ success: true, message: 'Referee removed from match' });
    } catch (err) { next(err); }
};

exports.bulkImport = async (req, res, next) => {
    try {
        const { rows } = req.body;
        const result = await bulkImport({
            tableName: 'match',
            columns: ['tournament_id', 'stadium_id', 'home_team_id', 'away_team_id', 'match_date', 'match_time', 'stage', 'result'],
            rows,
            transformRow: (row) => ({
                ...row,
                tournament_id: row.tournament_id ? parseInt(row.tournament_id, 10) : null,
                stadium_id: row.stadium_id ? parseInt(row.stadium_id, 10) : null,
                home_team_id: row.home_team_id ? parseInt(row.home_team_id, 10) : null,
                away_team_id: row.away_team_id ? parseInt(row.away_team_id, 10) : null,
            }),
        });
        res.json({
            success: true,
            message: `Successfully imported ${result.count} match(es)`,
            count: result.count,
        });
    } catch (err) { next(err); }
};