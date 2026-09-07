const db = require('../config/db');
const { bulkDelete } = require('../utils/bulkDelete');

exports.getAll = async (req, res, next) => {
    try {
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
            ORDER BY m.match_date DESC
        `);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
    try {
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
        res.json({ success: true, data: rows[0] });
    } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
    try {
        const { tournament_id, stadium_id, home_team_id, away_team_id, match_date, match_time, stage, result } = req.body;
        if (!tournament_id || !stadium_id || !home_team_id || !away_team_id || !match_date || !match_time || !stage)
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        if (Number(home_team_id) === Number(away_team_id))
            return res.status(400).json({ success: false, message: 'Home and away teams must be different' });
        const resVal = result && result.trim() ? result.trim() : null;
        const [r] = await db.query(
            'INSERT INTO `match` (tournament_id, stadium_id, home_team_id, away_team_id, match_date, match_time, stage, result) VALUES (?,?,?,?,?,?,?,?)',
            [parseInt(tournament_id, 10), parseInt(stadium_id, 10), parseInt(home_team_id, 10), parseInt(away_team_id, 10), match_date, match_time, stage.trim(), resVal]
        );
        res.status(201).json({ success: true, data: { match_id: r.insertId, ...req.body } });
    } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
    try {
        const { tournament_id, stadium_id, home_team_id, away_team_id, match_date, match_time, stage, result } = req.body;
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
        res.json({ success: true, message: 'Match updated successfully' });
    } catch (err) { next(err); }
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
        const [rows] = await db.query(`
            SELECT r.* FROM referee r
            INNER JOIN match_referee mr ON mr.referee_id = r.referee_id
            WHERE mr.match_id = ?
        `, [req.params.id]);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};

exports.addReferee = async (req, res, next) => {
    try {
        const { referee_id } = req.body;
        await db.query(
            'INSERT IGNORE INTO match_referee (match_id, referee_id) VALUES (?,?)',
            [req.params.id, referee_id]
        );
        res.json({ success: true, message: 'Referee assigned to match' });
    } catch (err) { next(err); }
};

exports.removeReferee = async (req, res, next) => {
    try {
        await db.query(
            'DELETE FROM match_referee WHERE match_id=? AND referee_id=?',
            [req.params.id, req.params.refereeId]
        );
        res.json({ success: true, message: 'Referee removed from match' });
    } catch (err) { next(err); }
};

exports.getSponsors = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT sp.* FROM sponsor sp
            INNER JOIN match_sponsor ms ON ms.sponsor_id = sp.sponsor_id
            WHERE ms.match_id = ?
        `, [req.params.id]);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};

exports.addSponsor = async (req, res, next) => {
    try {
        const { sponsor_id } = req.body;
        await db.query(
            'INSERT IGNORE INTO match_sponsor (match_id, sponsor_id) VALUES (?,?)',
            [req.params.id, sponsor_id]
        );
        res.json({ success: true, message: 'Sponsor assigned to match' });
    } catch (err) { next(err); }
};

exports.removeSponsor = async (req, res, next) => {
    try {
        await db.query(
            'DELETE FROM match_sponsor WHERE match_id=? AND sponsor_id=?',
            [req.params.id, req.params.sponsorId]
        );
        res.json({ success: true, message: 'Sponsor removed from match' });
    } catch (err) { next(err); }
};