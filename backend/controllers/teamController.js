const db = require('../config/db');

exports.getAll = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT t.*, 
                a.name AS association_name,
                c.coach_id,
                CONCAT(TRIM(c.first_name), IF(c.last_name IS NOT NULL AND c.last_name != '', CONCAT(' ', TRIM(c.last_name)), '')) AS coach_name,
                (SELECT COUNT(*) FROM player p WHERE p.team_id = t.team_id) AS player_count
            FROM team t
            LEFT JOIN association a ON a.association_id = t.association_id
            LEFT JOIN coach c ON c.coach_id = (
                SELECT c2.coach_id FROM coach c2 
                WHERE c2.team_id = t.team_id 
                ORDER BY c2.coach_id DESC 
                LIMIT 1
            )
            ORDER BY t.fifa_ranking ASC, t.name ASC
        `);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT t.*, 
                a.name AS association_name,
                c.coach_id,
                CONCAT(TRIM(c.first_name), IF(c.last_name IS NOT NULL AND c.last_name != '', CONCAT(' ', TRIM(c.last_name)), '')) AS coach_name,
                (SELECT COUNT(*) FROM player p WHERE p.team_id = t.team_id) AS player_count
            FROM team t
            LEFT JOIN association a ON a.association_id = t.association_id
            LEFT JOIN coach c ON c.coach_id = (
                SELECT c2.coach_id FROM coach c2 
                WHERE c2.team_id = t.team_id 
                ORDER BY c2.coach_id DESC 
                LIMIT 1
            )
            WHERE t.team_id = ?
        `, [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Team not found' });
        res.json({ success: true, data: rows[0] });
    } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
    try {
        const { name, nickname, foundation_year, jersey_color, fifa_ranking, association_id, coach_id } = req.body;
        if (!name || !jersey_color || !association_id)
            return res.status(400).json({ success: false, message: 'Required fields missing' });

        const trimmedName = name.trim();
        const rankVal = fifa_ranking !== undefined && fifa_ranking !== '' ? parseInt(fifa_ranking, 10) : null;
        const foundYear = foundation_year !== undefined && foundation_year !== '' ? parseInt(foundation_year, 10) : 0;
        const assocId = parseInt(association_id, 10);

        // Check if exact match exists (case-sensitive)
        const [existing] = await db.query('SELECT team_id FROM team WHERE BINARY name = ?', [trimmedName]);
        let targetTeamId;

        if (existing.length > 0) {
            targetTeamId = existing[0].team_id;
            await db.query(
                'UPDATE team SET nickname=?, foundation_year=?, jersey_color=?, fifa_ranking=?, association_id=? WHERE team_id=?',
                [nickname?.trim() || null, foundYear, jersey_color.trim(), rankVal, assocId, targetTeamId]
            );
        } else {
            const [result] = await db.query(
                'INSERT INTO team (name, nickname, foundation_year, jersey_color, fifa_ranking, association_id) VALUES (?,?,?,?,?,?)',
                [trimmedName, nickname?.trim() || null, foundYear, jersey_color.trim(), rankVal, assocId]
            );
            targetTeamId = result.insertId;
        }

        // Handle coach assignment if coach_id is provided
        if (coach_id !== undefined) {
            if (coach_id) {
                const targetCoachId = parseInt(coach_id, 10);
                await db.query('UPDATE coach SET team_id = NULL WHERE team_id = ? AND coach_id != ?', [targetTeamId, targetCoachId]);
                await db.query('UPDATE coach SET team_id = ? WHERE coach_id = ?', [targetTeamId, targetCoachId]);
            } else {
                await db.query('UPDATE coach SET team_id = NULL WHERE team_id = ?', [targetTeamId]);
            }
        }

        res.status(201).json({ success: true, data: { team_id: targetTeamId, ...req.body } });
    } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
    try {
        const { name, nickname, foundation_year, jersey_color, fifa_ranking, association_id, coach_id } = req.body;
        if (!name || !jersey_color || !association_id)
            return res.status(400).json({ success: false, message: 'Required fields missing' });

        const targetTeamId = parseInt(req.params.id, 10);
        const rankVal = fifa_ranking !== undefined && fifa_ranking !== '' ? parseInt(fifa_ranking, 10) : null;
        const foundYear = foundation_year !== undefined && foundation_year !== '' ? parseInt(foundation_year, 10) : 0;
        const [result] = await db.query(
            'UPDATE team SET name=?, nickname=?, foundation_year=?, jersey_color=?, fifa_ranking=?, association_id=? WHERE team_id=?',
            [name.trim(), nickname?.trim() || null, foundYear, jersey_color.trim(), rankVal, parseInt(association_id, 10), targetTeamId]
        );
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Team not found' });

        // Handle coach assignment if coach_id is provided
        if (coach_id !== undefined) {
            if (coach_id) {
                const targetCoachId = parseInt(coach_id, 10);
                await db.query('UPDATE coach SET team_id = NULL WHERE team_id = ? AND coach_id != ?', [targetTeamId, targetCoachId]);
                await db.query('UPDATE coach SET team_id = ? WHERE coach_id = ?', [targetTeamId, targetCoachId]);
            } else {
                await db.query('UPDATE coach SET team_id = NULL WHERE team_id = ?', [targetTeamId]);
            }
        }

        res.json({ success: true, message: 'Team updated successfully' });
    } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
    try {
        await db.query('UPDATE coach SET team_id = NULL WHERE team_id = ?', [req.params.id]);
        const [result] = await db.query('DELETE FROM team WHERE team_id = ?', [req.params.id]);
        if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Team not found' });
        res.json({ success: true, message: 'Team deleted successfully' });
    } catch (err) { next(err); }
};

exports.getPlayers = async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT * FROM player WHERE team_id = ? ORDER BY position', [req.params.id]);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};

exports.getTournaments = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT t.* FROM tournament t
            INNER JOIN team_tournament tt ON tt.tournament_id = t.tournament_id
            WHERE tt.team_id = ?
            ORDER BY t.start_date DESC
        `, [req.params.id]);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};